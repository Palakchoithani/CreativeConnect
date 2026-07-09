import prisma from './src/prisma';

async function main() {
  console.log('Seeding demo messages...');
  
  // Get some users
  const users = await prisma.user.findMany({ take: 5 });
  if (users.length < 2) {
    console.log('Not enough users to create conversations. Need at least 2 users.');
    return;
  }
  
  const user1 = users[0];
  
  const demoConversations = [
    {
      partner: users[1],
      messages: [
        { sender: users[1], content: 'Hey there! I saw your portfolio and I love your recent UI/UX work.' },
        { sender: user1, content: 'Thank you so much! I really appreciate it. I spent a lot of time on that project.' },
        { sender: users[1], content: 'Are you currently open to freelance opportunities? We are looking for someone to help with a new mobile app design.' },
        { sender: user1, content: 'Yes, I am! I would love to hear more details about the app.' },
        { sender: users[1], content: 'Great! Let me send over the design brief.' }
      ]
    }
  ];
  
  if (users.length > 2) {
    demoConversations.push({
      partner: users[2],
      messages: [
        { sender: user1, content: 'Hi! I noticed we both follow the same design communities. Would love to connect!' },
        { sender: users[2], content: 'Absolutely! Always happy to connect with fellow designers.' }
      ]
    });
  }
  
  if (users.length > 3) {
    demoConversations.push({
      partner: users[3],
      messages: [
        { sender: users[3], content: 'Hi, I wanted to ask about the 3D rendering tutorial you posted.' },
        { sender: user1, content: 'Sure thing, what did you need help with?' },
        { sender: users[3], content: 'I am getting a strange artifacting error when I export to WebGL.' }
      ]
    });
  }
  
  for (const convo of demoConversations) {
    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user1.id } } },
          { participants: { some: { userId: convo.partner.id } } }
        ]
      },
      include: { messages: true }
    });
    
    if (existing && existing.messages.length > 0) {
      console.log(`Conversation between ${user1.name} and ${convo.partner.name} already exists. Skipping.`);
      continue;
    }
    
    let conversationId = existing?.id;
    
    if (!existing) {
      const newConvo = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: user1.id },
              { userId: convo.partner.id }
            ]
          }
        }
      });
      conversationId = newConvo.id;
    }
    
    // Add messages sequentially to stagger timestamps slightly
    let timeOffset = 0;
    for (const msg of convo.messages) {
      await prisma.message.create({
        data: {
          content: msg.content,
          senderId: msg.sender.id,
          conversationId: conversationId as string,
          createdAt: new Date(Date.now() - (1000000 - timeOffset))
        }
      });
      timeOffset += 60000; // +1 minute
    }
    
    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    
    console.log(`Created conversation between ${user1.name} and ${convo.partner.name} with ${convo.messages.length} messages.`);
  }
  
  console.log('Seeding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
