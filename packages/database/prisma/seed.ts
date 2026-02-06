import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create test user
  const user = await prisma.user.upsert({
    where: { phone: "9876543210" },
    update: {},
    create: {
      phone: "9876543210",
      name: "Demo User",
      email: "demo@suvidha.gov.in",
      address: "123 Gandhi Road",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      language: "en",
      isVerified: true,
      role: "CITIZEN",
    },
  });
  console.log(`✅ Created user: ${user.name} (${user.phone})`);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { phone: "9999999999" },
    update: {},
    create: {
      phone: "9999999999",
      name: "Admin User",
      email: "admin@suvidha.gov.in",
      address: "SUVIDHA HQ, Smart City Complex",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      language: "en",
      isVerified: true,
      role: "ADMIN",
    },
  });
  console.log(`✅ Created admin: ${admin.name} (${admin.phone})`);

  // Create service connections
  const connections = await Promise.all([
    prisma.serviceConnection.upsert({
      where: { connectionNo: "ELEC-2024-001234" },
      update: {},
      create: {
        userId: user.id,
        serviceType: "ELECTRICITY",
        connectionNo: "ELEC-2024-001234",
        meterNo: "MTR-98765",
        address: "123 Gandhi Road",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        status: "ACTIVE",
        connectionDate: new Date("2023-01-15"),
      },
    }),
    prisma.serviceConnection.upsert({
      where: { connectionNo: "WATER-2024-005678" },
      update: {},
      create: {
        userId: user.id,
        serviceType: "WATER",
        connectionNo: "WATER-2024-005678",
        meterNo: "WTR-54321",
        address: "123 Gandhi Road",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        status: "ACTIVE",
        connectionDate: new Date("2023-02-20"),
      },
    }),
    prisma.serviceConnection.upsert({
      where: { connectionNo: "GAS-2024-009012" },
      update: {},
      create: {
        userId: user.id,
        serviceType: "GAS",
        connectionNo: "GAS-2024-009012",
        address: "123 Gandhi Road",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        status: "ACTIVE",
        connectionDate: new Date("2023-03-10"),
      },
    }),
  ]);
  console.log(`✅ Created ${connections.length} service connections`);

  // Create bills
  const now = new Date();
  const bills = await Promise.all([
    prisma.bill.upsert({
      where: { billNo: "BILL-ELEC-2024-0001" },
      update: {},
      create: {
        connectionId: connections[0].id,
        userId: user.id,
        billNo: "BILL-ELEC-2024-0001",
        billDate: new Date("2024-01-01"),
        periodFrom: new Date("2024-01-01"),
        periodTo: new Date("2024-01-31"),
        amount: 2450.0,
        totalAmount: 2450.0,
        dueDate: new Date("2024-02-15"),
        status: "UNPAID",
        unitsConsumed: 245,
      },
    }),
    prisma.bill.upsert({
      where: { billNo: "BILL-WATER-2024-0001" },
      update: {},
      create: {
        connectionId: connections[1].id,
        userId: user.id,
        billNo: "BILL-WATER-2024-0001",
        billDate: new Date("2024-01-01"),
        periodFrom: new Date("2024-01-01"),
        periodTo: new Date("2024-01-31"),
        amount: 850.0,
        totalAmount: 850.0,
        dueDate: new Date("2024-02-20"),
        status: "UNPAID",
        unitsConsumed: 15000,
      },
    }),
    prisma.bill.upsert({
      where: { billNo: "BILL-GAS-2024-0001" },
      update: {},
      create: {
        connectionId: connections[2].id,
        userId: user.id,
        billNo: "BILL-GAS-2024-0001",
        billDate: new Date("2024-01-01"),
        periodFrom: new Date("2024-01-01"),
        periodTo: new Date("2024-01-31"),
        amount: 1200.0,
        totalAmount: 1200.0,
        dueDate: new Date("2024-02-10"),
        status: "OVERDUE",
      },
    }),
    prisma.bill.upsert({
      where: { billNo: "BILL-ELEC-2023-0012" },
      update: {},
      create: {
        connectionId: connections[0].id,
        userId: user.id,
        billNo: "BILL-ELEC-2023-0012",
        billDate: new Date("2023-12-01"),
        periodFrom: new Date("2023-12-01"),
        periodTo: new Date("2023-12-31"),
        amount: 2100.0,
        totalAmount: 2100.0,
        amountPaid: 2100.0,
        dueDate: new Date("2024-01-15"),
        status: "PAID",
        unitsConsumed: 210,
      },
    }),
  ]);
  console.log(`✅ Created ${bills.length} bills`);

  // Create a grievance
  const grievance = await prisma.grievance.upsert({
    where: { ticketNo: "GRV-2024-000001" },
    update: {},
    create: {
      userId: user.id,
      serviceType: "ELECTRICITY",
      ticketNo: "GRV-2024-000001",
      category: "Power Outage",
      subject: "Frequent power cuts in sector 5",
      description: "We are experiencing frequent power cuts lasting 2-3 hours daily for the past week.",
      priority: "HIGH",
      status: "IN_PROGRESS",
    },
  });
  console.log(`✅ Created grievance: ${grievance.ticketNo}`);

  // Create notifications
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: user.id,
        title: "Bill Due Soon",
        titleHi: "बिल जल्द देय है",
        message: "Your electricity bill of ₹2,450 is due on Feb 15, 2024",
        messageHi: "आपका बिजली बिल ₹2,450 का भुगतान 15 फरवरी 2024 तक करना है",
        type: "BILL_DUE",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Scheduled Maintenance",
        titleHi: "अनुसूचित रखरखाव",
        message: "Water supply will be interrupted on Feb 5, 2024 from 10 AM to 2 PM",
        messageHi: "5 फरवरी 2024 को सुबह 10 बजे से दोपहर 2 बजे तक पानी की आपूर्ति बाधित रहेगी",
        type: "SERVICE_UPDATE",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Grievance Update",
        titleHi: "शिकायत अपडेट",
        message: "Your complaint GRV-2024-000001 is now being processed",
        messageHi: "आपकी शिकायत GRV-2024-000001 पर कार्रवाई की जा रही है",
        type: "GRIEVANCE_UPDATE",
        isRead: true,
      },
    ],
  });
  console.log("✅ Created notifications");

  // Create system alerts
  await prisma.systemAlert.create({
    data: {
      title: "Gas Pipeline Maintenance",
      titleHi: "गैस पाइपलाइन रखरखाव",
      message: "Planned maintenance in Zone 3 on Feb 8, 2024",
      messageHi: "8 फरवरी 2024 को ज़ोन 3 में नियोजित रखरखाव",
      severity: "info",
      serviceType: "GAS",
      isActive: true,
      startsAt: new Date(),
    },
  });
  console.log("✅ Created system alerts");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test Logins:");
  console.log("   CITIZEN:");
  console.log("     Phone: 9876543210");
  console.log("     OTP: (check console for mock OTP)");
  console.log("\n   ADMIN:");
  console.log("     Phone: 9999999999");
  console.log("     OTP: (check console for mock OTP)");
  console.log("     Access: /admin");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
