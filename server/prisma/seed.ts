import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create a system user for seeded questions
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@starcamp.local' },
    update: {},
    create: { email: 'system@starcamp.local', password: 'not-a-real-login', name: 'System' },
  });

  const sections = [
    { name: 'Introduction', description: 'Background & motivation', defaultDuration: 5, order: 1 },
    { name: 'CS Foundations', description: 'Programming, OS, DB, networking', defaultDuration: 20, order: 2 },
    { name: 'Whiteboard Coding', description: 'Problem solving & DSA', defaultDuration: 20, order: 3 },
    { name: 'Technical Skills', description: 'Role-specific, self-learning', defaultDuration: 15, order: 4 },
    { name: 'Mindset & Collaboration', description: 'Learning, teamwork', defaultDuration: 10, order: 5 },
    { name: 'Wrap-up', description: 'Candidate questions', defaultDuration: 5, order: 6 },
  ];

  const sectionRecords = [];
  for (const section of sections) {
    const rec = await prisma.section.upsert({
      where: { name: section.name },
      update: {},
      create: section,
    });
    sectionRecords.push(rec);
  }
  console.log('Seeded 6 sections');

  const sampleQuestions: Record<string, { text: string; answer: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD' }[]> = {
    'Introduction': [
      { text: 'Tell me about yourself and your background.', answer: 'Look for clarity, passion, relevance to tech.', difficulty: 'EASY' },
      { text: 'Why are you interested in the Starcamp program?', answer: 'Look for genuine motivation, awareness of program goals.', difficulty: 'EASY' },
      { text: 'What project are you most proud of and why?', answer: 'Evaluate storytelling, technical depth, impact.', difficulty: 'MEDIUM' },
      { text: 'Where do you see yourself in 2-3 years?', answer: 'Look for ambition, realistic goals, growth mindset.', difficulty: 'EASY' },
      { text: 'What do you know about our company and products?', answer: 'Check preparation level and genuine interest.', difficulty: 'MEDIUM' },
    ],
    'CS Foundations': [
      { text: 'Explain the difference between stack and heap memory.', answer: 'Stack: automatic, LIFO, fast, limited size. Heap: dynamic, manual/GC, slower, larger.', difficulty: 'EASY' },
      { text: 'What is the difference between TCP and UDP?', answer: 'TCP: connection-oriented, reliable, ordered. UDP: connectionless, fast, no guarantee.', difficulty: 'EASY' },
      { text: 'Explain ACID properties in databases.', answer: 'Atomicity, Consistency, Isolation, Durability. Each ensures reliable transactions.', difficulty: 'MEDIUM' },
      { text: 'What is a deadlock? How can it be prevented?', answer: 'Two+ processes waiting for each other. Prevent: ordering, timeout, detection.', difficulty: 'MEDIUM' },
      { text: 'Explain the difference between process and thread.', answer: 'Process: independent, own memory. Thread: shared memory, lighter, within process.', difficulty: 'HARD' },
    ],
    'Whiteboard Coding': [
      { text: 'Reverse a linked list.', answer: 'Iterate with prev/curr/next pointers. O(n) time, O(1) space.', difficulty: 'EASY' },
      { text: 'Find the first non-repeating character in a string.', answer: 'Use hashmap for frequency count, then iterate. O(n) time.', difficulty: 'EASY' },
      { text: 'Implement a function to check if a binary tree is balanced.', answer: 'Recursive height check. Balanced if |left-right| <= 1 at every node.', difficulty: 'MEDIUM' },
      { text: 'Design an LRU Cache with O(1) get and put.', answer: 'HashMap + doubly linked list. Map stores key->node, list maintains order.', difficulty: 'HARD' },
      { text: 'Find the longest substring without repeating characters.', answer: 'Sliding window with hashset. O(n) time, O(min(n,m)) space.', difficulty: 'MEDIUM' },
    ],
    'Technical Skills': [
      { text: 'What is REST? Name the key principles.', answer: 'Stateless, client-server, cacheable, uniform interface, layered system.', difficulty: 'EASY' },
      { text: 'Explain the concept of CI/CD.', answer: 'Continuous Integration: auto merge+test. Continuous Deployment: auto deploy to prod.', difficulty: 'EASY' },
      { text: 'What is Docker and why is it useful?', answer: 'Containerization platform. Consistent environments, isolation, portability.', difficulty: 'MEDIUM' },
      { text: 'Explain the difference between SQL and NoSQL databases.', answer: 'SQL: structured, ACID, joins. NoSQL: flexible schema, horizontal scaling, eventual consistency.', difficulty: 'MEDIUM' },
      { text: 'How does Git branching work? Explain a branching strategy.', answer: 'Branches are pointers to commits. GitFlow: main, develop, feature, release, hotfix.', difficulty: 'HARD' },
    ],
    'Mindset & Collaboration': [
      { text: 'Describe a time you had a disagreement with a teammate. How did you resolve it?', answer: 'Look for empathy, communication, compromise, focus on outcome.', difficulty: 'EASY' },
      { text: 'How do you approach learning a new technology?', answer: 'Look for structured approach: docs, tutorials, hands-on project, community.', difficulty: 'EASY' },
      { text: 'Tell me about a time you failed. What did you learn?', answer: 'Look for honesty, self-awareness, concrete lessons, growth.', difficulty: 'MEDIUM' },
      { text: 'How do you prioritize tasks when everything seems urgent?', answer: 'Look for framework: impact/effort matrix, communication with stakeholders.', difficulty: 'MEDIUM' },
      { text: 'How do you give and receive feedback?', answer: 'Look for constructive approach, specific examples, openness to criticism.', difficulty: 'HARD' },
    ],
    'Wrap-up': [
      { text: 'Do you have any questions for us?', answer: 'Good candidates ask thoughtful questions about team, culture, growth.', difficulty: 'EASY' },
      { text: 'Is there anything else you would like us to know?', answer: 'Opportunity for candidate to highlight overlooked strengths.', difficulty: 'EASY' },
      { text: 'What are your salary expectations?', answer: 'Check if expectations align with program compensation.', difficulty: 'MEDIUM' },
      { text: 'When would you be available to start?', answer: 'Check availability and any constraints.', difficulty: 'EASY' },
      { text: 'How did you hear about this opportunity?', answer: 'Helps track recruitment channels effectiveness.', difficulty: 'EASY' },
    ],
  };

  let questionCount = 0;
  for (const section of sectionRecords) {
    const questions = sampleQuestions[section.name] || [];
    for (const q of questions) {
      const existing = await prisma.question.findFirst({
        where: { text: q.text, sectionId: section.id },
      });
      if (!existing) {
        await prisma.question.create({
          data: {
            sectionId: section.id,
            text: q.text,
            answer: q.answer,
            difficulty: q.difficulty,
            tags: [],
            createdBy: systemUser.id,
          },
        });
        questionCount++;
      }
    }
  }
  console.log(`Seeded ${questionCount} sample questions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
