import { NextRequest, NextResponse } from 'next/server';

// Static user database - in production, this should be in a real database
const VALID_USERS = [
  { email: 'admin@mandumah.com', password: 'mandumah2025', name: 'Administrator' },
  { email: 'librarian@mandumah.com', password: 'library2025', name: 'Librarian' },
  { email: 'researcher@mandumah.com', password: 'research2025', name: 'Researcher' },
  { email: 'analyst@mandumah.com', password: 'analysis2025', name: 'Data Analyst' },
  { email: 'manager@mandumah.com', password: 'manage2025', name: 'Manager' }
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = VALID_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Successful login
    return NextResponse.json(
      { 
        success: true, 
        user: { 
          email: user.email, 
          name: user.name 
        } 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
