const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { PharmacyStock } = require("../models/pharmacyStock");
const { Pharmacy } = require("../models/pharmacy");

// Nodemailer transporter
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

const checkExpiringStocks = async () => {
  try {
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const expiringStocks = await PharmacyStock.find({
      "expirationPerStock.expirationDate": { $lte: oneMonthFromNow },
    })
      .populate("pharmacy")
      .populate("medicine");

    const pharmacyExpiringStocks = {};

    for (const stock of expiringStocks) {
      const pharmacy = await Pharmacy.findById(stock.pharmacy).populate("userInfo");

      if (!pharmacy || !pharmacy.userInfo?.email) continue;

      const pharmacyId = pharmacy._id.toString();
      const pharmacyEmail = pharmacy.userInfo.email;
      const pharmacyName = pharmacy.userInfo.name;

      if (!pharmacyExpiringStocks[pharmacyId]) {
        pharmacyExpiringStocks[pharmacyId] = {
          email: pharmacyEmail,
          name: pharmacyName,
          medicines: [],
        };
      }

      const medicine = stock.medicine;
      const medicineName = medicine
        ? `${medicine.brandName} (${medicine.genericName})`
        : "Unknown Medicine";

      stock.expirationPerStock
        .filter((item) => new Date(item.expirationDate) <= oneMonthFromNow)
        .forEach((item) => {
          pharmacyExpiringStocks[pharmacyId].medicines.push({
            name: medicineName,
            stock: item.stock,
            expiryDate: item.expirationDate.toISOString().split("T")[0],
          });
        });
    }

    for (const pharmacyId in pharmacyExpiringStocks) {
      const { email, name, medicines } = pharmacyExpiringStocks[pharmacyId];

      if (medicines.length === 0) continue;

      const medicineTableRows = medicines
        .map(
          (med) => `
          <tr>
            <td style="border: 1px solid #0a5d7e; padding: 8px;">${med.name}</td>
            <td style="border: 1px solid #0a5d7e; padding: 8px; text-align: center;">${med.stock}</td>
            <td style="border: 1px solid #0a5d7e; padding: 8px; text-align: center;">${med.expiryDate}</td>
          </tr>`
        )
        .join("");

      const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "⚠️ Medicine Expiry Alert",
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f1f9ff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #0a5d7e;">Hello ${name},</h2>
            <p style="color: #317698;">The following medicines in your pharmacy are expiring soon:</p>
            <table style="border-collapse: collapse; width: 100%; background-color: #ffffff;">
              <thead>
                <tr style="background-color: #0a5d7e; color: #ffffff;">
                  <th style="border: 1px solid #0a5d7e; padding: 10px; text-align: left;">Medicine</th>
                  <th style="border: 1px solid #0a5d7e; padding: 10px; text-align: center;">Stock</th>
                  <th style="border: 1px solid #0a5d7e; padding: 10px; text-align: center;">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                ${medicineTableRows}
              </tbody>
            </table>
            <p style="color: #317698;">Please take necessary action to manage your stock.</p>
            <p style="color: #14967f; font-weight: bold;">- ePharmacy Locator</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Expiry notification sent to ${email}`);
    }
  } catch (error) {
    console.error("Error checking expiring stocks:", error);
  }
};

// Schedule the job to run daily at 9am
cron.schedule("0 9 * * *", checkExpiringStocks);

module.exports = { checkExpiringStocks };

