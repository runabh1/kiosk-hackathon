/**
 * Reset Bills to UNPAID Status
 * 
 * Run this script to reset bills back to UNPAID so you can test Razorpay payments.
 * Usage: npx tsx packages/database/reset-bills.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔄 Resetting bills to UNPAID status...");

    // Reset all bills except one paid bill (for history)
    const result = await prisma.bill.updateMany({
        where: {
            status: {
                in: ['PAID', 'PARTIAL']
            }
        },
        data: {
            status: 'UNPAID',
            amountPaid: 0,
        }
    });

    console.log(`✅ Reset ${result.count} bill(s) to UNPAID status`);

    // Also create a new unpaid bill with a future due date for testing
    const user = await prisma.user.findFirst({
        where: { role: 'CITIZEN' }
    });

    if (user) {
        const connection = await prisma.serviceConnection.findFirst({
            where: { userId: user.id, serviceType: 'ELECTRICITY' }
        });

        if (connection) {
            const now = new Date();
            const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

            const newBill = await prisma.bill.upsert({
                where: { billNo: `BILL-TEST-${now.getFullYear()}-${now.getMonth() + 1}` },
                update: {
                    status: 'UNPAID',
                    amountPaid: 0,
                },
                create: {
                    connectionId: connection.id,
                    userId: user.id,
                    billNo: `BILL-TEST-${now.getFullYear()}-${now.getMonth() + 1}`,
                    billDate: now,
                    periodFrom: new Date(now.getFullYear(), now.getMonth(), 1),
                    periodTo: new Date(now.getFullYear(), now.getMonth() + 1, 0),
                    amount: 1500,
                    totalAmount: 1500,
                    dueDate: futureDate,
                    status: 'UNPAID',
                    unitsConsumed: 150,
                },
            });

            console.log(`✅ Created/Updated test bill: ${newBill.billNo} (₹${newBill.totalAmount})`);
        }
    }

    // Show current bills
    const bills = await prisma.bill.findMany({
        include: { connection: true },
        orderBy: { dueDate: 'desc' },
    });

    console.log("\n📋 Current Bills:");
    bills.forEach(bill => {
        console.log(`   ${bill.billNo} | ${bill.connection.serviceType} | ₹${bill.totalAmount} | ${bill.status}`);
    });

    console.log("\n🎉 Done! You can now test Razorpay payments.");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
