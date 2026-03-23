import { NextResponse } from 'next/server';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('id');

  if (!guildId) {
    return NextResponse.json({ error: 'Guild ID is required' }, { status: 400 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  try {
    // with_counts=true gives us approximate_member_count & approximate_presence_count
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${guildId}?with_counts=true`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          Accept: 'application/json',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
      }
      throw new Error(`Discord API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      id: data.id,
      name: data.name,
      presence_count: data.approximate_presence_count,
      member_count: data.approximate_member_count,
      icon: data.icon,
      description: data.description,
    });
  } catch (error) {
    console.error('Discord Guild API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guild data' },
      { status: 500 }
    );
  }
}