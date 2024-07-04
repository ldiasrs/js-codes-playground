import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { readFileSync } from "fs";
import config from "../../config/global-config.prod.json" assert { type: "json" };
import { debug } from "../common/commons.js";
import moment from "moment";
import { writeFile } from "../common/commons.js";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

const readInputFile = (filePath) => {
  const csvFile = readFileSync(filePath, "utf8");
  const results = Papa.parse(csvFile, { delimiter: "," });
  const rawData = results.data.slice(1).map((row) => ({
    date: row[0],
    arrivingDate: row[1],
    type: row[2],
    confirmationCode: row[3],
    nights: row[4],
    guest: row[5],
    listing: row[6],
    details: row[7],
    referenceCode: row[8],
    amount: row[9],
    paidOut: row[10],
    serviceFee: row[11],
    cleaningFee: row[12],
    grossEarnings: row[13],
  }));

  const bookingMap = new Map();
  rawData.forEach((row) => {
    if (!row.date) return;
    const key = row.date;
    const reservation = bookingMap.get(key) ?? { date: key };
    if (row.type === "Payout") {
      reservation.paidOut = row.paidOut;
      reservation.details = row.details;
      reservation.arrivingDate = row.arrivingDate;
    }
    if (row.type === "Co-host payout") {
      reservation.listing = row.listing;
      reservation.confirmationCode = row.confirmationCode;
      reservation.guest = row.guest;
      reservation.referenceCode = row.referenceCode;
      reservation.coHostPayout = row.amount;
      reservation.nights = row.nights;
    }
    if (row.type === "Reservation") {
      reservation.reservationAmount = row.amount;
      reservation.serviceFee = row.serviceFee;
      reservation.cleaningFee = row.cleaningFee;
      reservation.grossEarnings = row.grossEarnings;
    }
    bookingMap.set(key, reservation);
  });
  return Array.from(bookingMap.values()).filter(
    (booking) => !!booking.confirmationCode
  );
};

const normalizeFloat = (value) => {
  return value ? parseFloat(value?.replace("$", "")) : 0;
};

const percentage = (total, value) => {
  return Number(((value / total) * 100).toFixed(2));
};

const calculatePrices = (booking) => {
  const grossEarning = normalizeFloat(booking.grossEarnings);
  //airbnbService = grossEarning * 3.3%
  const airbnbService = normalizeFloat(booking.serviceFee);
  const cleaningFee = normalizeFloat(booking.cleaningFee);
  //reservationAmount = grossEarning * 96.7%
  const reservationAmount = normalizeFloat(booking.reservationAmount);
  //coHostPayout = reservationAmount * 80%
  const coHostPayout = -normalizeFloat(booking.coHostPayout);
  //coHostPayout = reservationAmount * 20%
  const hostingService = Number(
    (reservationAmount - coHostPayout - cleaningFee).toFixed(2)
  );
  const farHostingService = Number(
    ((grossEarning - cleaningFee) * 0.2).toFixed(2)
  );
  const nights = normalizeFloat(booking.nights);
  const nightlyGrossEarning = Number((reservationAmount / nights).toFixed(2));
  const total = grossEarning;

  return {
    nights,
    grossEarning,
    grossEarningPercentage: percentage(total, grossEarning),
    airbnbService,
    airbnbServicePercentage: percentage(total, airbnbService),
    reservationAmount,
    ownerPayout: coHostPayout,
    ownerPayoutPercentage: percentage(total, coHostPayout),
    airnbHostingPayout: booking.paidOut,
    hostingService,
    hostingServicePercentage: percentage(total, hostingService),
    farHostingService,
    cleaningFee,
    cleaningFeePercentage: percentage(total, cleaningFee),
    nightlyGrossEarning,
  };
};
const generateReportData = (bookingData) => {
  const reservations = bookingData.map((booking) => {
    return {
      reservationCode: booking.confirmationCode ?? "",
      paymentDate: booking.date,
      arrivingDate: booking.arrivingDate,
      ...calculatePrices(booking),
    };
  });
  const totalHostingServices = reservations.reduce(
    (acc, curr) => acc + curr.hostingService,
    0
  );
  const farTotalHostingServices = reservations.reduce(
    (acc, curr) => acc + curr.farHostingService,
    0
  );
  return {
    reservations,
    totalHostingServices,
    farTotalHostingServices,
  };
};

async function writeSheet(doc, sheetTabName, data) {
  const sheet = await doc.addSheet({
    title: sheetTabName,
    headerValues: [
      "ativo",
      "taxa",
      "numeroNota",
      "aplicado",
      "valorBruto",
      "dataCompra",
      "dataVencimento",
      "valorLiquido",
    ],
  });
  await sheet.addRows(data);
}

const generateHostingInvoiceSpreadsheet = async (data) => {
  try {
    if (!process.argv[2]) {
      console.error("\nERROR: Please provide the input file with data");
      console.log(
        "Example: npm run airbnb-hosting-invoice ./data/treehaus_apr_airbnb_04_2024-04_2024.csv"
      );
      process.exit(1);
    }

    debug("Reading inputile");
    const inputFilePath = process.argv[2];
    const data = readInputFile(inputFilePath);
    console.log(data);

    debug("Generating report data");
    const reportData = generateReportData(data);
    console.log(reportData);

    // debug("Accessing document...");
    // const jwt = new JWT({
    //   email: config.airbnb_hosting_update.client_email,
    //   key: config.airbnb_hosting_update.private_key,
    //   scopes: SCOPES,
    // });

    // const doc = new GoogleSpreadsheet(
    //   config.airbnb_hosting_update.spread_sheet_id,
    //   jwt
    // );

    // debug("Loanding document...");
    // await doc.loadInfo();
    // const sheetNameCurrentDateTime = new Date()
    //   .toISOString()
    //   .replace(/:/g, "-");

    // debug(`Writing ativos tab`);
    // //await writeSheet(doc, "ativos", data);
  } catch (error) {
    console.error("Error writing data to spreadsheet:", error);
  }
};

await generateHostingInvoiceSpreadsheet();
