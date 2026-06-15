const mysql = require('mysql2/promise');
let sql;

const buatKoneksi = async () => {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
};

const getMetode = async () => {
    const db = await buatKoneksi();
    sql = "SELECT * FROM backup ORDER BY id DESC";
    const [rows] = await db.execute(sql);
    await db.end();
    return rows.length > 0 ? rows : [];
};

const getDetailBackup = async (id_backup) => {
    const db = await buatKoneksi();
    sql = `SELECT * FROM backup_transaksi WHERE id_backup = ?`;
    try {
        const [rows] = await db.execute(sql, [id_backup]);
        await db.end();
        return rows.length > 0 ? rows : [];
    } catch(err) {
        console.error("Error getDetailBackup:", err.message);
        await db.end();
        return [];
    }
};

const tambahBackup = async (id, nama, channel) => {
    const db = await buatKoneksi();
    sql = `INSERT INTO backup VALUES('${id}', '${nama}', '${channel}', NOW())`;
    try {
        await db.execute(sql);
        await db.end();
        return "1";
    } catch(err) {
        await db.end();
        return "0";
    }
};

const tambahTransaksi = async (idx, id, waktux, nominalx, jenisx, deskripsix) => {
    const db = await buatKoneksi();
    sql = `INSERT INTO backup_transaksi VALUES('${idx}', '${id}', '${waktux}', '${nominalx}', '${jenisx}', '${deskripsix}')`;
    try {
        await db.execute(sql);
        await db.end();
        return "1";
    } catch(err) {
        await db.end();
        return "0";
    }
};

module.exports = { getMetode, buatKoneksi, tambahBackup, tambahTransaksi, getDetailBackup };