import prisma from './src/prisma';

async function main() {
  console.log('Seeding demo messages across ALL users...');
  
  const users = await prisma.user.findMany();
  if (users.length < 2) {
    console.log('Not enough users to create conversations.');
    return;
  }
  
  let created = 0;
  
  // Every user gets a conversation with the first 3 users in the DB (to ensure maximum visibility)
  for (let i = 0; i < users.length; i++) {
    const user1 = users[i];
    
    for (let j = 0; j < Math.min(3, users.length); j++) {
      if (i === j) continue;
      const user2 = users[j];
      
      const existing = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: user1.id } } },
            { participants: { some: { userId: user2.id } } }
          ]
        },
        include: { messages: true }
      });
      
      if (existing && existing.messages.length > 0) continue;
      
      let conversationId = existing?.id;
      
      if (!existing) {
        const newConvo = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId: user1.id },
                { userId: user2.id }
              ]
            }
          }
        });
        conversationId = newConvo.id;
      }
      
      // Add a couple of generic messages
      await prisma.message.create({
        data: {
          content: 'Hey! I saw your recent work and wanted to connect. Do you have time to chat this week?',
          senderId: user2.id,
          conversationId: conversationId as string,
          createdAt: new Date(Date.now() - 100000)
        }
      });
      
      await prisma.message.create({
        data: {
          content: 'Absolutely! I would love to connect. What time works best for you?',
          senderId: user1.id,
          conversationId: conversationId as string,
          createdAt: new Date(Date.now() - 50000)
        }
      });
      
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
      
      created++;
    }
  }
  
  console.log(`Successfully generated ${created} new conversations!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
