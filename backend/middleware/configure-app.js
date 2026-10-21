const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOptions } = require('../config/cors');

function configureApp(app, io) {
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ------------------- Security -------------------
  app.use(
    helmet({
      contentSecurityPolicy: false, // You can customize later
      frameguard: true,
      hsts: { maxAge: 31536000, includeSubDomains: true },
    }),
  );
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const blockedPaths = ['/wp-admin', '/wp-login.php', '/phpmyadmin', '/.env'];

    if (blockedPaths.some((p) => req.url.includes(p))) {
      return res.status(444).end(); // nginx-style drop
    }

    next();
  });

  // ------------------- Optional: Console Debug Logger -------------------
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  // ------------------- Make io available in all routes -------------------
  app.use((req, res, next) => {
    req.io = io || app.locals.io;
    next();
  });

  // ------------------- Local uploads (UPLOAD_MODE=local) -------------------
  {
    const path = require('path');
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
    app.use(
      '/uploads',
      (req, res, next) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
      },
      express.static(uploadDir),
    );
  }
}
module.exports = { configureApp };
