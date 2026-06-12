import { http, HttpResponse } from 'msw';
import { mockEvents, mockInventory, mockExpenses } from './fixtures';

const supabaseUrl = 'https://*/rest/v1';

export const handlers = [
  http.get(`${supabaseUrl}/events`, () => {
    return HttpResponse.json(mockEvents);
  }),
  http.post(`${supabaseUrl}/events`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...body, id: 999 }, { status: 201 });
  }),
  http.patch(`${supabaseUrl}/events`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(body);
  }),
  http.get(`${supabaseUrl}/inventory_items`, () => {
    return HttpResponse.json(mockInventory);
  }),
  http.get(`${supabaseUrl}/expenses`, () => {
    return HttpResponse.json(mockExpenses);
  }),
  http.patch(`${supabaseUrl}/expenses`, () => {
    return HttpResponse.json({ status: 'approved' });
  }),
];
