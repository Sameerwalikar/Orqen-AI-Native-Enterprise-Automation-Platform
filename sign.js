import crypto from "crypto";

const secret = "81bf85cc61674d04fb3005cd47e671875aa3158e57970855d906c03afae7ea8a";

const body = JSON.stringify({
    ticketId: "NS-48217",
    priority: "high",
    message: "Replacement order has not shipped."
});

const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

console.log("Signature:", signature);
console.log("Body:", body);