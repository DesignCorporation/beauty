import { HelloBeauty } from '@dc-beauty/ui';

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Beauty Booking Platform</h1>
      <p>Professional salon booking system</p>
      <p>Multi-tenant SaaS for beauty salons</p>
      <HelloBeauty name="Booking" />
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Features:</h2>
        <ul>
          <li>✅ Multi-language support (PL/RU/UA/EN)</li>
          <li>✅ Multi-currency system</li>
          <li>✅ 40+ beauty services</li>
          <li>✅ Automated workflows</li>
          <li>✅ Public booking widget</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
