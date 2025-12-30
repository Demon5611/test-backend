import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  // 80% запросов - чтение с Replica (GET)
  if (Math.random() < 0.8) {
    const response = http.get(`${BASE_URL}/api/orders`, {
      tags: { name: 'GetOrders' },
    });
    
    // Вывод ошибок для диагностики
    if (response.status !== 200) {
      console.log(`GET Error: ${response.status} - ${response.body}`);
    }
    
    const result = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });
    
    errorRate.add(!result);
  } 
  // 20% запросов - запись на Master (POST)
  else {
    const payload = JSON.stringify({
      userId: `f1afca3f-0ff7-4067-a311-0db7bbb8b4d3`,
      productId: `product-1`,
      status: 'pending',
    });
    
    const response = http.post(`${BASE_URL}/api/orders`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'CreateOrder' },
    });
    
    // Вывод ошибок для диагностики
    if (response.status !== 201) {
      console.log(`POST Error: ${response.status} - ${response.body}`);
    }
    
    const result = check(response, {
      'status is 201': (r) => r.status === 201,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!result);
  }
  
  sleep(0.1);
}