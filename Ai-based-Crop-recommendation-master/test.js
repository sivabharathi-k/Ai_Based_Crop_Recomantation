async function runTest() {
  try {
    console.log('Testing registration...');
    const email = `test${Date.now()}@test.com`;
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: email,
        password: 'password123',
        role: 'farmer'
      })
    });
    const regData = await regRes.json();
    console.log('Registration success:', regData);
    
    if (!regData.token) {
      console.log('No token in response, exiting.');
      return;
    }
    const token = regData.token;
    
    console.log('\nTesting prediction...');
    const predRes = await fetch('http://localhost:5000/api/predictions/crop', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        nitrogen: 50,
        phosphorus: 50,
        potassium: 50,
        temperature: 25,
        humidity: 50,
        ph: 6.5,
        rainfall: 1000,
        soilType: 'Loamy'
      })
    });
    const predData = await predRes.json();
    console.log('Prediction outcome HTTP status:', predRes.status);
    console.log('Prediction data:', JSON.stringify(predData, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runTest();
