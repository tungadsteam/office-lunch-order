-- Migration v3: Allow negative user balance during lunch settlement
-- Problem: CHECK (balance >= 0) blocked settlement when a participant had insufficient balance.
-- Fix: Remove the constraint so balance can go negative (user owes the system).
-- Run this on existing production DB.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_balance_check;
