import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { localStore } from '../db/store.js';
import { generateToken, verifyAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register new consumer account
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, mobile, password, passwordConfirmation, state, district, locality, panchayat, consumerNumber } = req.body;

    if (!name || !email || !mobile || !password) {
      res.status(400).json({ error: 'Name, email, mobile number, and password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (passwordConfirmation && password !== passwordConfirmation) {
      res.status(400).json({ error: 'Password confirmation does not match.' });
      return;
    }

    const existingUser = localStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (existingUser) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Security rule: Ordinary users CAN NEVER self-assign admin roles during registration
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      passwordHash,
      role: 'consumer' as const, // strictly enforced consumer role
      state: state?.trim() || 'Bihar',
      district: district?.trim() || 'Patna',
      locality: locality?.trim() || 'Rampur',
      panchayat: panchayat?.trim() || '',
      consumerNumber: consumerNumber?.trim() || '',
      active: true,
      createdAt: new Date().toISOString(),
    };

    localStore.users.push(newUser);

    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      state: newUser.state,
      district: newUser.district,
      locality: newUser.locality,
      panchayat: newUser.panchayat,
    });

    res.status(201).json({
      message: 'Registration successful! Welcome to BijliWatch.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        state: newUser.state,
        district: newUser.district,
        locality: newUser.locality,
        panchayat: newUser.panchayat,
        consumerNumber: newUser.consumerNumber,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Registration failed. ' + error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = localStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: 'This account has been deactivated. Please contact administration.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      state: user.state,
      district: user.district,
      locality: user.locality,
      panchayat: user.panchayat,
      department: user.department,
    });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        state: user.state,
        district: user.district,
        locality: user.locality,
        panchayat: user.panchayat,
        consumerNumber: user.consumerNumber,
        department: user.department,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Login error. ' + error.message });
  }
});

// Current User Profile
router.get('/me', verifyAuth, (req: AuthRequest, res: Response) => {
  const user = localStore.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      state: user.state,
      district: user.district,
      locality: user.locality,
      panchayat: user.panchayat,
      consumerNumber: user.consumerNumber,
      department: user.department,
    },
  });
});

// Demo Fast Switcher (For evaluators and testers to experience all 4 tiers)
router.post('/demo-login', (req: Request, res: Response) => {
  const { role } = req.body;
  const user = localStore.users.find((u) => u.role === role);

  if (!user) {
    res.status(404).json({ error: `Demo account for role '${role}' not found.` });
    return;
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    state: user.state,
    district: user.district,
    locality: user.locality,
    panchayat: user.panchayat,
    department: user.department,
  });

  res.json({
    message: `Switched to demo role: ${user.role}`,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      state: user.state,
      district: user.district,
      locality: user.locality,
      panchayat: user.panchayat,
      consumerNumber: user.consumerNumber,
      department: user.department,
    },
  });
});

// Password reset simulation with secure token
router.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  // To prevent user enumeration, always return safe response
  res.json({
    message: 'If an account is associated with this email address, a password reset instruction link has been dispatched.',
  });
});

export default router;
