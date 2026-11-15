
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('\n====================================');
  console.log('   LEXVAULT DEMO DATA GENERATOR');
  console.log('====================================\n');

  // 1. CREATE USERS
  const userData = [
    { name: 'System Administrator', email: 'admin@lawfirm.com', role: 'ADMIN', password: 'Admin@123' },

    { name: 'Justice Arvind Mehra', email: 'judge@lawfirm.com', role: 'JUDGE', password: 'Judge@123' },
    { name: 'Justice Priya Nair', email: 'judge2@lawfirm.com', role: 'JUDGE', password: 'Demo@123' },
    { name: 'Justice Rohan Kapoor', email: 'judge3@lawfirm.com', role: 'JUDGE', password: 'Demo@123' },

    { name: 'Adv. Jane Doe', email: 'lawyer@lawfirm.com', role: 'LAWYER', password: 'Lawyer@123' },
    { name: 'Adv. Rahul Sharma', email: 'lawyer2@lawfirm.com', role: 'LAWYER', password: 'Demo@123' },
    { name: 'Adv. Meera Iyer', email: 'lawyer3@lawfirm.com', role: 'LAWYER', password: 'Demo@123' },
    { name: 'Adv. Karan Malhotra', email: 'lawyer4@lawfirm.com', role: 'LAWYER', password: 'Demo@123' },
    { name: 'Adv. Ananya Rao', email: 'lawyer5@lawfirm.com', role: 'LAWYER', password: 'Demo@123' },

    { name: 'John Clerk', email: 'clerk@lawfirm.com', role: 'CLERK', password: 'Clerk@123' },
    { name: 'Sneha Verma', email: 'clerk2@lawfirm.com', role: 'CLERK', password: 'Demo@123' },
    { name: 'Vikram Patel', email: 'clerk3@lawfirm.com', role: 'CLERK', password: 'Demo@123' },
  ];

  const users = {};

  for (const item of userData) {
    const hashedPassword = await bcrypt.hash(item.password, 12);

    users[item.email] = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        role: item.role,
      },
      create: {
        name: item.name,
        email: item.email,
        role: item.role,
        password: hashedPassword,
      },
    });
  }

  console.log(`✓ ${userData.length} users created/verified`);

  // 2. CREATE CASES
  const caseData = [
    {
      caseNumber: 'LEX-2025-001',
      title: 'Rao vs Mehta - Property Ownership Dispute',
      description: 'Civil litigation concerning disputed ownership and boundaries of a commercial property in Mumbai.',
      status: 'ACTIVE',
      restricted: false,
      judge: 'judge@lawfirm.com',
      creator: 'clerk@lawfirm.com',
      lawyers: ['lawyer@lawfirm.com', 'lawyer2@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-002',
      title: 'State vs Malhotra - Financial Fraud',
      description: 'Criminal proceedings involving alleged financial irregularities and fraudulent transactions.',
      status: 'PENDING',
      restricted: true,
      judge: 'judge2@lawfirm.com',
      creator: 'admin@lawfirm.com',
      lawyers: ['lawyer3@lawfirm.com', 'lawyer4@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-003',
      title: 'Meridian Technologies vs Apex Systems',
      description: 'Commercial contract dispute involving breach of software development and service agreements.',
      status: 'ACTIVE',
      restricted: false,
      judge: 'judge3@lawfirm.com',
      creator: 'clerk2@lawfirm.com',
      lawyers: ['lawyer2@lawfirm.com', 'lawyer5@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-004',
      title: 'Sharma Family Estate Settlement',
      description: 'Civil proceedings concerning inheritance, estate distribution and competing property claims.',
      status: 'ON_HOLD',
      restricted: true,
      judge: 'judge@lawfirm.com',
      creator: 'clerk@lawfirm.com',
      lawyers: ['lawyer@lawfirm.com', 'lawyer3@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-005',
      title: 'Verma vs Global Logistics Pvt Ltd',
      description: 'Employment dispute regarding termination, contractual obligations and unpaid compensation.',
      status: 'CLOSED',
      restricted: false,
      judge: 'judge2@lawfirm.com',
      creator: 'clerk3@lawfirm.com',
      lawyers: ['lawyer4@lawfirm.com', 'lawyer5@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-006',
      title: 'Nova Brands - Intellectual Property Dispute',
      description: 'Trademark infringement allegations involving brand identity and unauthorized commercial use.',
      status: 'ACTIVE',
      restricted: false,
      judge: 'judge3@lawfirm.com',
      creator: 'clerk2@lawfirm.com',
      lawyers: ['lawyer@lawfirm.com', 'lawyer4@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-007',
      title: 'Consumer Association vs Urban Homes',
      description: 'Consumer complaint concerning delayed housing delivery and alleged contractual violations.',
      status: 'PENDING',
      restricted: false,
      judge: 'judge@lawfirm.com',
      creator: 'clerk@lawfirm.com',
      lawyers: ['lawyer2@lawfirm.com', 'lawyer3@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-008',
      title: 'Green Earth Foundation vs Metro Developers',
      description: 'Environmental compliance proceedings concerning construction activities and regulatory permissions.',
      status: 'ACTIVE',
      restricted: false,
      judge: 'judge2@lawfirm.com',
      creator: 'admin@lawfirm.com',
      lawyers: ['lawyer@lawfirm.com', 'lawyer5@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-009',
      title: 'Eastern Traders - Recovery of Commercial Dues',
      description: 'Commercial recovery proceedings involving outstanding invoices and disputed payments.',
      status: 'DRAFT',
      restricted: false,
      judge: 'judge3@lawfirm.com',
      creator: 'clerk2@lawfirm.com',
      lawyers: ['lawyer2@lawfirm.com', 'lawyer4@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-010',
      title: 'Summit Infrastructure - Construction Arbitration',
      description: 'Contractual arbitration concerning construction delays, project milestones and liquidated damages.',
      status: 'ON_HOLD',
      restricted: true,
      judge: 'judge@lawfirm.com',
      creator: 'clerk3@lawfirm.com',
      lawyers: ['lawyer3@lawfirm.com', 'lawyer5@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-011',
      title: 'Patel vs City Transport Corporation',
      description: 'Civil compensation claim arising from a fictional road accident and disputed liability.',
      status: 'CLOSED',
      restricted: false,
      judge: 'judge2@lawfirm.com',
      creator: 'clerk@lawfirm.com',
      lawyers: ['lawyer@lawfirm.com', 'lawyer2@lawfirm.com'],
    },
    {
      caseNumber: 'LEX-2025-012',
      title: 'Digital Commerce Data Protection Matter',
      description: 'Legal proceedings concerning alleged mishandling of customer information and contractual privacy obligations.',
      status: 'ACTIVE',
      restricted: true,
      judge: 'judge3@lawfirm.com',
      creator: 'admin@lawfirm.com',
      lawyers: ['lawyer4@lawfirm.com', 'lawyer5@lawfirm.com'],
    },
  ];

  const cases = {};

  for (const item of caseData) {
    cases[item.caseNumber] = await prisma.case.upsert({
      where: { caseNumber: item.caseNumber },
      update: {
        title: item.title,
        description: item.description,
        status: item.status,
        isRestricted: item.restricted,
        judgeId: users[item.judge].id,
      },
      create: {
        caseNumber: item.caseNumber,
        title: item.title,
        description: item.description,
        status: item.status,
        isRestricted: item.restricted,
        creatorId: users[item.creator].id,
        judgeId: users[item.judge].id,
      },
    });
  }

  console.log(`✓ ${caseData.length} cases created/verified`);

  // 3. CONNECT LAWYERS TO CASES
  const assignments = [];

  for (const item of caseData) {
    for (const email of item.lawyers) {
      assignments.push({
        caseId: cases[item.caseNumber].id,
        userId: users[email].id,
        role: 'LAWYER',
      });
    }
  }

  await prisma.caseAssignment.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  console.log(`✓ ${assignments.length} case assignments verified`);

  // 4. CREATE TASKS
  const taskTemplates = [
    { title: 'Review case documents', status: 'DONE' },
    { title: 'Prepare legal research and supporting material', status: 'IN_PROGRESS' },
    { title: 'Prepare hearing submission', status: 'TODO' },
  ];

  const tasks = [];
  let taskNumber = 1;

  for (const item of caseData) {
    const c = cases[item.caseNumber];
    const lawyer = users[item.lawyers[0]];

    for (let i = 0; i < taskTemplates.length; i++) {
      const template = taskTemplates[i];

      tasks.push({
        id: `demo-task-${String(taskNumber++).padStart(3, '0')}`,
        title: template.title,
        description: `Assigned as part of the ${item.caseNumber} case workflow.`,
        status: template.status,
        dueDate: new Date(Date.now() + (i - 1) * 7 * 86400000),
        caseId: c.id,
        assignedToId: lawyer.id,
      });
    }
  }

  await prisma.caseTask.createMany({
    data: tasks,
    skipDuplicates: true,
  });

  console.log(`✓ ${tasks.length} tasks created/verified`);

  // 5. CREATE CASE COMMENTS
  const comments = [];
  let commentNumber = 1;

  for (const item of caseData) {
    const c = cases[item.caseNumber];

    comments.push({
      id: `demo-comment-${String(commentNumber++).padStart(3, '0')}`,
      caseId: c.id,
      authorId: users[item.judge].id,
      content: `Case review update: The next procedural stage for ${item.caseNumber} is under review. All assigned parties should ensure that supporting records are available.`,
    });

    comments.push({
      id: `demo-comment-${String(commentNumber++).padStart(3, '0')}`,
      caseId: c.id,
      authorId: users[item.lawyers[0]].id,
      content: `Legal team update: Initial review is complete. The team is coordinating the next filing and evidence preparation activities.`,
    });
  }

  await prisma.caseComment.createMany({
    data: comments,
    skipDuplicates: true,
  });

  console.log(`✓ ${comments.length} comments created/verified`);

  // 6. CREATE REAL SAMPLE FILES AND DOCUMENT RECORDS
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR || './uploads');

  const documentTypes = [
    'PLEADING', 'EVIDENCE', 'BRIEF', 'CONTRACT',
    'ORDER', 'MOTION', 'OTHER', 'EVIDENCE',
    'BRIEF', 'CONTRACT', 'ORDER', 'PLEADING',
  ];

  const documents = [];

  for (let i = 0; i < caseData.length; i++) {
    const item = caseData[i];
    const c = cases[item.caseNumber];

    const originalName = `${item.caseNumber}-Case-Summary.txt`;
    const filename = `demo-${item.caseNumber.toLowerCase()}-summary.txt`;
    const caseFolder = path.join(uploadRoot, c.id);

    fs.mkdirSync(caseFolder, { recursive: true });

    const filePath = path.join(caseFolder, filename);

    const content = `
LEXVAULT - LEGAL CASE SUMMARY
========================================

DEMONSTRATION DOCUMENT
FICTIONAL INFORMATION - NOT FOR LEGAL USE

Case Number: ${item.caseNumber}
Case Title: ${item.title}

CASE DESCRIPTION
----------------------------------------
${item.description}

CASE STATUS
----------------------------------------
${item.status}

PRESIDING JUDGE
----------------------------------------
${users[item.judge].name}

ASSIGNED LEGAL TEAM
----------------------------------------
${item.lawyers.map(email => users[email].name).join('\n')}

CASE MANAGEMENT NOTES
----------------------------------------
This document is generated as sample data
for the LexVault Law Firm Case Management
System demonstration.

All names, matters and circumstances are
fictional.

Generated: ${new Date().toISOString()}

========================================
END OF DEMONSTRATION DOCUMENT
`;

    fs.writeFileSync(filePath, content, 'utf8');

    const existing = await prisma.document.findFirst({
      where: {
        caseId: c.id,
        originalName,
      },
    });

    const documentData = {
      filename,
      originalName,
      mimeType: 'text/plain',
      size: Buffer.byteLength(content, 'utf8'),
      type: documentTypes[i],
      version: 1,
      path: filePath,
      caseId: c.id,
      uploadedById: users[item.lawyers[0]].id,
    };

    const doc = existing
      ? await prisma.document.update({
          where: { id: existing.id },
          data: documentData,
        })
      : await prisma.document.create({
          data: documentData,
        });

    documents.push(doc);
  }

  console.log(`✓ ${documents.length} physical documents created/verified`);

  // 7. CREATE AUDIT LOGS
  const logs = [];

  for (let i = 0; i < caseData.length; i++) {
    const item = caseData[i];
    const c = cases[item.caseNumber];
    const doc = documents[i];

    logs.push({
      id: `demo-log-case-${String(i + 1).padStart(3, '0')}`,
      action: 'CASE_CREATED',
      ip: '127.0.0.1',
      userAgent: 'LexVault Demo Seeder',
      userId: users[item.creator].id,
      caseId: c.id,
    });

    logs.push({
      id: `demo-log-document-${String(i + 1).padStart(3, '0')}`,
      action: 'DEMO_DOCUMENT_ADDED',
      ip: '127.0.0.1',
      userAgent: 'LexVault Demo Seeder',
      userId: users[item.lawyers[0]].id,
      caseId: c.id,
      documentId: doc.id,
    });
  }

  await prisma.accessLog.createMany({
    data: logs,
    skipDuplicates: true,
  });

  console.log(`✓ ${logs.length} audit records created/verified`);

  console.log('\n====================================');
  console.log('       DEMO SEED COMPLETED!');
  console.log('====================================');
  console.log('Users:       12');
  console.log('Cases:       12');
  console.log('Assignments: 24');
  console.log('Tasks:       36');
  console.log('Comments:    24');
  console.log('Documents:   12');
  console.log('Audit logs:  24');
  console.log('\nAll sample cases and documents are fictional.');

  console.log('\nDEMO LOGIN ACCOUNTS');
  console.log('Admin:  admin@lawfirm.com / Admin@123');
  console.log('Judge:  judge@lawfirm.com / Judge@123');
  console.log('Lawyer: lawyer@lawfirm.com / Lawyer@123');
  console.log('Clerk:  clerk@lawfirm.com / Clerk@123');
  console.log('Other demo accounts: password Demo@123');
}

main()
  .catch((error) => {
    console.error('\nDEMO SEED FAILED:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
