import jwt from "jsonwebtoken";

const createJWT = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    // The frontend talks to the API through the same origin (Vite proxy), so
    // "lax" works on localhost. In production on different domains use "none".
    sameSite: isProd ? "none" : "lax",
    maxAge: 1 * 24 * 60 * 60 * 1000,
  });
};

export default createJWT;
