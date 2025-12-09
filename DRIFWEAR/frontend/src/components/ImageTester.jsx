import React, { useState, useEffect } from 'react';

function ImageDebug() {
  const [imageTests, setImageTests] = useState([]);

  const testImages = [
    // Product images
    '/customization/tshirt-front.png',
    '/customization/tshirt-back.png',
    '/customization/pants-front.png',
    '/customization/pants-back.png',
    '/customization/sneakers-front.png',
    '/customization/sneakers-back.png',
    // Graphics
    '/graphics/BU 1.png',
    '/graphics/BU Logo.png',
    '/graphics/fire hashira.png'
  ];

  useEffect(() => {
    const testAllImages = async () => {
      const results = await Promise.all(
        testImages.map(async (path) => {
          const exists = await testImage(path);
          return { path, exists };
        })
      );
      setImageTests(results);
    };

    testAllImages();
  }, []);

  const testImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const openImageInNewTab = (path) => {
    window.open(path, '_blank');
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f8f9fa', 
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      <h3>🖼️ Image Debug Tool</h3>
      <p>Testing if images exist in public folder:</p>
      
      <div style={{ marginTop: '15px' }}>
        {imageTests.map((test, index) => (
          <div 
            key={index} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '10px 0',
              padding: '10px',
              background: 'white',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}
          >
            <span 
              style={{ 
                marginRight: '10px',
                fontSize: '20px',
                color: test.exists ? '#28a745' : '#dc3545'
              }}
            >
              {test.exists ? '✅' : '❌'}
            </span>
            <span style={{ flex: 1, fontFamily: 'monospace' }}>{test.path}</span>
            <button 
              onClick={() => openImageInNewTab(test.path)}
              style={{
                padding: '5px 10px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Test
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '4px' }}>
        <h4>📁 Expected Folder Structure:</h4>
        <pre style={{ background: 'white', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
{`public/
├── customization/
│   ├── tshirt-front.png
│   ├── tshirt-back.png
│   ├── pants-front.png
│   ├── pants-back.png
│   ├── sneakers-front.png
│   └── sneakers-back.png
└── graphics/
    ├── BU 1.png
    ├── BU Logo.png
    └── fire hashira.png`}
        </pre>
      </div>
    </div>
  );
}

export default ImageDebug;