export async function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Next.js API route is working correctly",
      nextVersion: process.env.NEXT_VERSION || "14.2.15"
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}