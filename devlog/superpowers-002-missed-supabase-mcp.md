# Superpowers-002 — Missed Supabase MCP

**Date:** 2026-03-22
**Framework:** superpowers
**Phase:** Implementation planning

## Observation

The Superpowers session designed the entire app around Supabase (Postgres + Auth + Realtime + RLS) but never picked up on the Supabase MCP server being available. It used Context7 MCP to verify library docs, but didn't use (or notice) the Supabase MCP for direct database interaction, schema management, or RLS policy setup.

This is notable because:
- The spec has detailed table schemas, indexes, and RLS policies that could have been validated or even applied via the Supabase MCP
- Context7 was used proactively for doc lookups, so MCP awareness wasn't the issue — it just didn't connect the dots for Supabase specifically
- Worth watching whether the vanilla or other sessions pick it up

## Comparison Note

Another data point for the framework comparison: structured workflows don't guarantee tool discovery. The Superpowers process was thorough on design but missed an available integration that could have streamlined implementation.
