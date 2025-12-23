'use server';

export async function sendMessageAction(prevState: any, formData: FormData) {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const message = formData.get('message');
  console.log('Server Action received:', message);

  // Return simulated response
  return {
    messages: [
      ...(prevState?.messages || []),
      { role: 'user', content: message },
      { role: 'assistant', content: `AI Coach: "${message}"에 대한 분석 결과입니다...` },
    ],
  };
}
