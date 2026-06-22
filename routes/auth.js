const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const db = require("../db");

// Halaman registrasi
router.get("/register", (req, res) => {
    res.render("register", { error: null, qrCode: null, secret: null });
});

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        // Generate OTP secret
        const secret = speakeasy.generateSecret({ name: `AppKamu (${username})` });
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan ke DB
        await db.registerUser(username, hashedPassword, secret.base32);

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        res.render("register", { error: null, qrCode, secret: secret.base32 });
    } catch (err) {
        res.render("register", { error: "Username sudah digunakan.", qrCode: null, secret: null });
    }
});

// Halaman login step 1
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.getUserByUsername(username);
    if (!user) return res.render("login", { error: "Username tidak ditemukan." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render("login", { error: "Password salah." });

    // Simpan sementara di session untuk step 2
    req.session.tempUser = { id: user.id, username: user.username, otp_secret: user.otp_secret };
    res.redirect("/verify-otp");
});

// Halaman OTP step 2
router.get("/verify-otp", (req, res) => {
    if (!req.session.tempUser) return res.redirect("/login");
    res.render("verify-otp", { error: null });
});

router.post("/verify-otp", (req, res) => {
    if (!req.session.tempUser) return res.redirect("/login");
    const { token } = req.body;
    const verified = speakeasy.totp.verify({
        secret: req.session.tempUser.otp_secret,
        encoding: "base32",
        token: token,
        window: 1
    });
    if (!verified) return res.render("verify-otp", { error: "Kode OTP salah atau kadaluarsa." });

    // Login berhasil
    req.session.user = req.session.tempUser;
    delete req.session.tempUser;
    res.redirect("/");
});

// Halaman konfirmasi logout
router.get("/logout-confirm", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.render("logout-confirm", { user: req.session.user });
});

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

module.exports = router;