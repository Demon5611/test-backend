import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Разогрев: 100 VU
    { duration: '1m', target: 500 },     // Увеличение: 500 VU
    { duration: '2m', target: 1000 },   // Основная нагрузка: 1000 VU
    { duration: '1m', target: 2000 },   // Пиковая нагрузка: 2000 VU
    { duration: '30s', target: 0 },     // Снижение
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],   // Увеличить порог для высокой нагрузки
    http_req_failed: ['rate<0.05'],     // Допустить до 5% ошибок при высокой нагрузке
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

const USER_IDS = [
  'f1afca3f-0ff7-4067-a311-0db7bbb8b4d3',
  '0a5efa57-0183-4b83-9b75-23adbc7b1331',
  '621dcbbd-525c-4559-91d6-8bc243b34466',
  'bc342bc7-e3bb-490f-ac30-2ffe73d38c5e',
  '4f6a8ee8-5284-4dce-b6ea-1da458ad1c71',
  '3f36f3e6-2e39-4651-b5b2-b46ed5902dab',
  '69a1915e-801f-4cbb-9819-8142923d2059',
  '5f147405-da63-4272-8f58-12568619a822',
  '819c1f9c-f1ff-481f-991c-1071c3ceaeac',
  '70f8f774-c1c2-4b13-bc57-30b696e1516f',
];

const PRODUCT_IDS = [
  'c6b4d43b-8207-42b2-ae1c-e16e5e16300c',
  '7f3072dc-4ff1-47d1-8fbb-2c8d644d3129',
  'dc6c6f35-abfb-4a48-86a5-ef7ceb6e2c04',
  '78b0a18d-46d6-41d1-b920-d87f53acd97c',
  '5e3bcea1-074f-4dc8-a4fc-f80185c5d185',
  'd709d741-0723-463d-b386-06a2338c0f5d',
  '17b22d51-e0dc-4773-a5c2-ad27a8da727e',
  '3c1cc4e4-271d-4562-99b2-e18a09e12b91',
];

function getRandomId(ids) {
  if (!ids || ids.length === 0) {
    return null;
  }
  return ids[Math.floor(Math.random() * ids.length)];
}

export default function () {
  // 80% запросов - чтение с Replica (GET)
  if (Math.random() < 0.8) {
    const response = http.get(`${BASE_URL}/api/orders`, {
      tags: { name: 'GetOrders' },
      timeout: '30s',
    });
    
    const result = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 300ms': (r) => r.timings.duration < 300,
    });
    
    errorRate.add(!result);
  } 
  // 20% запросов - запись на Master (POST)
  else {
    const randomUserId = getRandomId(USER_IDS);
    const randomProductId = getRandomId(PRODUCT_IDS);
    
    if (!randomUserId || !randomProductId) {
      return;
    }
    
    const payload = JSON.stringify({
      userId: randomUserId,
      productId: randomProductId,
      status: 'pending',
    });
    
    const response = http.post(`${BASE_URL}/api/orders`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'CreateOrder' },
      timeout: '30s',
    });
    
    const result = check(response, {
      'status is 201': (r) => r.status === 201,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!result);
  }
}