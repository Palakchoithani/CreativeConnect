import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/client';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash passwords
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const recruiterHash = await bcrypt.hash('Recruiter@123', 10);
  const designerHash = await bcrypt.hash('Designer@123', 10);
  const photographerHash = await bcrypt.hash('Photo@123', 10);
  const writerHash = await bcrypt.hash('Writer@123', 10);
  const musicHash = await bcrypt.hash('Music@123', 10);

  // 1. Create Users
  console.log('1. Creating users...');
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@creativeconnect.com',
      name: 'Admin Master',
      passwordHash: adminHash,
      role: 'ADMIN'
    }
  });

  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@creativeconnect.com',
      name: 'Recruiter Pro',
      passwordHash: recruiterHash,
      role: 'RECRUITER'
    }
  });

  const designer = await prisma.user.create({
    data: {
      email: 'designer@creativeconnect.com',
      name: 'Designer Creative',
      passwordHash: designerHash,
      role: 'CREATIVE'
    }
  });

  const photographer = await prisma.user.create({
    data: {
      email: 'photographer@creativeconnect.com',
      name: 'Photographer Pro',
      passwordHash: photographerHash,
      role: 'CREATIVE'
    }
  });

  const writer = await prisma.user.create({
    data: {
      email: 'writer@creativeconnect.com',
      name: 'Writer Master',
      passwordHash: writerHash,
      role: 'CREATIVE'
    }
  });

  const music = await prisma.user.create({
    data: {
      email: 'music@creativeconnect.com',
      name: 'Music Producer',
      passwordHash: musicHash,
      role: 'CREATIVE'
    }
  });

  // 2. Create Profiles
  console.log('2. Creating profiles...');
  await prisma.profile.createMany({
    data: [
      { userId: admin.id, bio: 'System administrator.', location: 'HQ', skills: 'System, Moderation' },
      { userId: recruiter.id, bio: 'Lead Recruiter at DesignForge.', location: 'San Francisco, CA', skills: 'Talent, Recruiting' },
      { userId: designer.id, bio: 'UI/UX specialist and 3D generalist.', location: 'New York, NY', skills: 'Figma, Blender, UI/UX' },
      { userId: photographer.id, bio: 'Fashion and landscape photographer.', location: 'Los Angeles, CA', skills: 'Camera, Lightroom, Studio' },
      { userId: writer.id, bio: 'Copywriter, novelist, and poet.', location: 'London, UK', skills: 'SEO, Writing, Editing' },
      { userId: music.id, bio: 'Electronic music producer and sound engineer.', location: 'Berlin, DE', skills: 'Ableton, Sound Design, Mix' }
    ]
  });

  // 3. Create Company Profile for Recruiter
  console.log('3. Creating recruiter company profile...');
  await prisma.company.create({
    data: {
      recruiterId: recruiter.id,
      name: 'DesignForge Studios',
      description: 'DesignForge is a premium global agency building digital products and brands.',
      website: 'https://designforge.io'
    }
  });

  // 4. Create Jobs
  console.log('4. Seeding posted jobs...');
  const job1 = await prisma.job.create({
    data: {
      posterId: recruiter.id,
      title: 'Senior UI/UX Designer',
      company: 'DesignForge Studios',
      location: 'New York, NY (Hybrid)',
      type: 'FULL_TIME',
      salary: '$120,000 - $140,000',
      description: 'Lead design workshops, build auto-layout design systems, and ship product designs.'
    }
  });

  const job2 = await prisma.job.create({
    data: {
      posterId: recruiter.id,
      title: 'Lead Fashion Photographer',
      company: 'DesignForge Studios',
      location: 'Los Angeles, CA',
      type: 'CONTRACT',
      salary: '$80,000 - $100,000',
      description: 'Direct studio photo sessions and edit campaign materials.'
    }
  });

  const job3 = await prisma.job.create({
    data: {
      posterId: recruiter.id,
      title: 'Creative Content Copywriter',
      company: 'DesignForge Studios',
      location: 'Remote',
      type: 'FREELANCE',
      salary: '$60,000 - $70,000',
      description: 'Write engaging SEO content, blog posts, and marketing campaigns.'
    }
  });

  // 5. Create Job Applications
  console.log('5. Creating job applications...');
  const app1 = await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      applicantId: designer.id,
      status: 'SHORTLISTED'
    }
  });

  const app2 = await prisma.jobApplication.create({
    data: {
      jobId: job2.id,
      applicantId: photographer.id,
      status: 'PENDING'
    }
  });

  // 6. Create Interview Slots
  console.log('6. Scheduling interviews...');
  await prisma.interview.create({
    data: {
      jobId: job1.id,
      recruiterId: recruiter.id,
      candidateId: designer.id,
      date: new Date(Date.now() + 3 * 24 * 3600 * 1000), // 3 days later
      linkUrl: 'https://zoom.us/j/123456789',
      notes: 'Initial technical walkthrough portfolio review.'
    }
  });

  // 7. Seed Portfolios
  console.log('7. Seeding portfolios...');
  await prisma.portfolio.create({
    data: {
      creatorId: designer.id,
      title: 'Modern Fintech Mobile App',
      subtitle: 'Premium auto-layout design case study',
      description: 'A complete end-to-end design showcasing dark-mode interfaces, user flows, and wireframes.',
      category: 'UI/UX Design',
      tags: 'figma, fintech, mobile',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      likes: 12,
      views: 120
    }
  });

  await prisma.portfolio.create({
    data: {
      creatorId: photographer.id,
      title: 'Monochrome Urban Portraits',
      subtitle: 'Contrast and architectural composition study',
      description: 'Street portrait collection in high contrast black and white.',
      category: 'Photography',
      tags: 'street, blackandwhite, urban',
      coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      likes: 8,
      views: 85
    }
  });

  // 8. Create Project Collaboration
  console.log('8. Creating collaborations...');
  const project = await prisma.project.create({
    data: {
      ownerId: designer.id,
      title: '3D Metaverse Room Configurator',
      description: 'Procedural room designer using Three.js and Blender.',
      repoUrl: 'https://github.com/designer/metaverse-room',
      liveUrl: 'https://metaverse-config.io',
      members: {
        create: [
          { userId: designer.id, role: 'OWNER' },
          { userId: music.id, role: 'MEMBER' }
        ]
      }
    }
  });

  // 9. Add tasks to collaboration
  console.log('9. Seeding collaboration tasks...');
  await prisma.task.createMany({
    data: [
      { projectId: project.id, assigneeId: designer.id, title: 'Mesh optimization', description: 'Bake room lighting textures and export GLTF files.', status: 'TODO' },
      { projectId: project.id, assigneeId: music.id, title: 'Procedural audio effects', description: 'Synthesize room background hum track.', status: 'IN_PROGRESS' }
    ]
  });

  // 10. Seed follow connections
  console.log('10. Creating network connections...');
  await prisma.connection.createMany({
    data: [
      { followerId: designer.id, followingId: photographer.id, status: 'ACCEPTED' },
      { followerId: photographer.id, followingId: designer.id, status: 'ACCEPTED' }
    ]
  });

  // 11. Notifications
  console.log('11. Creating initial notifications...');
  await prisma.notification.createMany({
    data: [
      { userId: designer.id, type: 'REQUEST', content: 'Recruiter Pro shortlisted your application for Senior UI/UX Designer!', linkUrl: '/jobs' },
      { userId: designer.id, type: 'REMINDER', content: 'Upcoming interview with DesignForge Studios scheduled in 3 days.', linkUrl: '/dashboard' }
    ]
  });

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
