import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// POST /api/availability/request - Create availability request
export async function POST(request) {
  try {
    const body = await request.json();
    const { dates, message, requestedBy } = body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'Dates array is required' },
        { status: 400 }
      );
    }

    if (!requestedBy) {
      return NextResponse.json(
        { error: 'Requested by is required' },
        { status: 400 }
      );
    }

    // Generate unique request ID
    const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const availabilityRequest = {
      id: requestId,
      dates: dates,
      message: message || '',
      requestedBy: requestedBy,
      status: 'pending', // pending, completed, cancelled
      responses: [], // Will store member responses
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get existing requests
    let existingRequests;
    try {
      const requests = await redis.get('availability_requests');
      existingRequests = Array.isArray(requests) ? requests : [];
    } catch (error) {
      console.log('Redis data type conflict in POST, clearing corrupted data...');
      await redis.del('availability_requests');
      existingRequests = [];
    }

    // Add new request
    const updatedRequests = [...existingRequests, availabilityRequest];
    await redis.set('availability_requests', updatedRequests);

    return NextResponse.json(availabilityRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating availability request:', error);
    return NextResponse.json(
      { error: 'Failed to create availability request' },
      { status: 500 }
    );
  }
}

// GET /api/availability/request - Get all availability requests
export async function GET() {
  try {
    let requests;
    try {
      requests = await redis.get('availability_requests');
    } catch (error) {
      console.log('Redis data type conflict in GET, clearing corrupted data...');
      await redis.del('availability_requests');
      requests = null;
    }
    
    const requestsArray = Array.isArray(requests) ? requests : [];
    return NextResponse.json(requestsArray);
  } catch (error) {
    console.error('Error fetching availability requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability requests' },
      { status: 500 }
    );
  }
}

// PUT /api/availability/request - Update availability request (add response)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { requestId, memberId, memberName, response } = body;

    if (!requestId || !memberId || !response) {
      return NextResponse.json(
        { error: 'Request ID, member ID, and response are required' },
        { status: 400 }
      );
    }

    // Get existing requests
    let existingRequests;
    try {
      const requests = await redis.get('availability_requests');
      existingRequests = Array.isArray(requests) ? requests : [];
    } catch (error) {
      console.log('Redis data type conflict in PUT, clearing corrupted data...');
      await redis.del('availability_requests');
      existingRequests = [];
    }

    // Find the request
    const requestIndex = existingRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'Availability request not found' },
        { status: 404 }
      );
    }

    const updatedRequest = { ...existingRequests[requestIndex] };
    
    // Add or update response
    const existingResponseIndex = updatedRequest.responses.findIndex(
      resp => resp.memberId === memberId
    );

    const memberResponse = {
      memberId,
      memberName: memberName || 'Unknown Member',
      response, // available, unavailable, maybe
      respondedAt: new Date().toISOString()
    };

    if (existingResponseIndex !== -1) {
      updatedRequest.responses[existingResponseIndex] = memberResponse;
    } else {
      updatedRequest.responses.push(memberResponse);
    }

    updatedRequest.updatedAt = new Date().toISOString();

    // Update in Redis
    const updatedRequests = [...existingRequests];
    updatedRequests[requestIndex] = updatedRequest;
    await redis.set('availability_requests', updatedRequests);

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating availability request:', error);
    return NextResponse.json(
      { error: 'Failed to update availability request' },
      { status: 500 }
    );
  }
}

// DELETE /api/availability/request - Delete availability request
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get existing requests
    let existingRequests;
    try {
      const requests = await redis.get('availability_requests');
      existingRequests = Array.isArray(requests) ? requests : [];
    } catch (error) {
      console.log('Redis data type conflict in DELETE, clearing corrupted data...');
      await redis.del('availability_requests');
      existingRequests = [];
    }

    // Find and remove the request
    const updatedRequests = existingRequests.filter(req => req.id !== requestId);
    
    if (updatedRequests.length === existingRequests.length) {
      return NextResponse.json(
        { error: 'Availability request not found' },
        { status: 404 }
      );
    }

    await redis.set('availability_requests', updatedRequests);

    return NextResponse.json({ message: 'Availability request deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability request:', error);
    return NextResponse.json(
      { error: 'Failed to delete availability request' },
      { status: 500 }
    );
  }
} 