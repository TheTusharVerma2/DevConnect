import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  // TODO 1: Get the Authorization header from req.headers.authorization
  // It looks like: "Bearer eyJhbGc..."
  // You need to split it and grab just the token part (after "Bearer ")
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  // TODO 2: If there's no header at all, return 401 
  // with { error: 'No token provided' }
    if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // TODO 3: Use jwt.verify(token, process.env.JWT_SECRET) inside a try/catch.
  // If it succeeds, it returns the decoded payload (remember what you 
  // put in there during jwt.sign()? — { userId: ... })
  // Attach it to the request: req.userId = decoded.userId
  // Then call next() to let the request continue to the actual route.
  //
  // If jwt.verify() throws (invalid signature OR expired token), 
  // catch it and return 401 with { error: 'Invalid or expired token' }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

}

export default authenticateToken;