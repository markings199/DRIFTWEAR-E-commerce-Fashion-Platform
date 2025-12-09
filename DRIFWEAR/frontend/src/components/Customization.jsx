import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Customization.css';

function Customization({ openAuthModal, currentUser }) {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState('designer');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleBackToProducts = () => {
    navigate('/products');
  };

  // Product Selection Screen
  const ProductSelection = () => (
    <div className="product-selection">
      <div className="product-selection-content">
        <h1 className="mb-4">Choose a Product to Design</h1>
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <button 
            className="btn btn-primary product-btn" 
            onClick={() => setSelectedProduct('tshirt')}
          >
            <i className="fas fa-tshirt me-2"></i>T-shirt
          </button>
          <button 
            className="btn btn-success product-btn" 
            onClick={() => setSelectedProduct('pants')}
          >
            <i className="fas fa-tshirt me-2"></i>Pants
          </button>
          <button 
            className="btn btn-info product-btn" 
            onClick={() => setSelectedProduct('sneakers')}
          >
            <i className="fas fa-shoe-prints me-2"></i>Sneakers
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="customization-page">
      <div className="container">
        <nav aria-label="breadcrumb" style={{ marginBottom: '2rem' }}>
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item"><a href="/products">Products</a></li>
            <li className="breadcrumb-item active">Customization</li>
          </ol>
        </nav>

        <div className="customization-header">
          <h1>Customize Your Products</h1>
          <p className="subtitle">Create unique designs or choose from pre-made templates</p>
        </div>

        {/* Show product selection OR designer interface */}
        {!selectedProduct ? (
          <ProductSelection />
        ) : (
          <>
            {/* Tool Selection Tabs */}
            <div className="tool-selection-tabs">
              <button 
                className={`tool-tab ${activeTool === 'designer' ? 'active' : ''}`}
                onClick={() => setActiveTool('designer')}
              >
                <i className="fas fa-paint-brush me-2"></i>
                Design Your Own
              </button>
              <button 
                className={`tool-tab ${activeTool === 'premade' ? 'active' : ''}`}
                onClick={() => setActiveTool('premade')}
              >
                <i className="fas fa-shopping-bag me-2"></i>
                Buy Pre-made Design
              </button>
            </div>

            {/* Content Area */}
            <div className="tool-content">
              {activeTool === 'designer' ? (
                <DesignerTool 
                  currentUser={currentUser} 
                  openAuthModal={openAuthModal} 
                  selectedProduct={selectedProduct}
                  onBackToSelection={() => setSelectedProduct(null)}
                />
              ) : (
                <PremadeTool currentUser={currentUser} openAuthModal={openAuthModal} />
              )}
            </div>
          </>
        )}

        {/* Back Button */}
        <div className="text-center mt-5">
          <button 
            className="btn btn-outline-secondary btn-lg"
            onClick={handleBackToProducts}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Products
          </button>
        </div>
      </div>
    </div>
  );
}

// Designer Tool Component
function DesignerTool({ currentUser, openAuthModal, selectedProduct, onBackToSelection }) {
  const [canvas, setCanvas] = useState(null);
  const [currentPage, setCurrentPage] = useState('front');
  const [selectedObject, setSelectedObject] = useState(null);
  const [productColor, setProductColor] = useState('#531b1bff');
  const [drawingMode, setDrawingMode] = useState('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Touch gesture state
  const [isPinching, setIsPinching] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [lastTouchEnd, setLastTouchEnd] = useState(0);

  // Using relative paths for images
  const getImagePath = (folder, filename) => {
    return `/${folder}/${filename}`;
  };

  const productImages = {
    tshirt: {
      front: getImagePath('customization', 'tshirt-front.png'),
      back: getImagePath('customization', 'tshirt-back.png'),
      left: getImagePath('customization', 'tshirt-left.png'),
      right: getImagePath('customization', 'tshirt-right.png')
    },
    pants: {
      front: getImagePath('customization', 'pants-front.png'),
      back: getImagePath('customization', 'pants-back.png'),
      left: getImagePath('customization', 'pants-left.png'),
      right: getImagePath('customization', 'pants-right.png')
    },
    sneakers: {
      front: getImagePath('customization', 'sneakers-front.png'),
      back: getImagePath('customization', 'sneakers-back.png'),
      left: getImagePath('customization', 'sneakers-left.png'),
      right: getImagePath('customization', 'sneakers-right.png')
    }
  };

  // Graphics with relative URLs
  const graphics = [
    { name: 'BU 1', file_path: getImagePath('graphics', 'BU 1.png') },
    { name: 'BU Logo', file_path: getImagePath('graphics', 'BU Logo.png') },
    { name: 'BU Paint 2', file_path: getImagePath('graphics', 'BU paint 2.png') },
    { name: 'BU Paint', file_path: getImagePath('graphics', 'BU paint.png') },
    { name: 'BU Torch 1', file_path: getImagePath('graphics', 'BU torch 1.png') },
    { name: 'BU Torch 2', file_path: getImagePath('graphics', 'BU torch 2.png') },
    { name: 'Fire Hashira', file_path: getImagePath('graphics', 'fire hashtra.png') },
    { name: 'Flame', file_path: getImagePath('graphics', 'flame.png') },
    { name: 'Giyu', file_path: getImagePath('graphics', 'giyu.png') },
    { name: 'Kamado', file_path: getImagePath('graphics', 'kamado.png') },
    { name: 'Nezuko', file_path: getImagePath('graphics', 'nezuko.png') }
  ];

  // Product prices
  const productPrices = {
    tshirt: 2500,
    pants: 2800,
    sneakers: 3500
  };

  // Test if images exist
  const testImageExists = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Function to save custom designs to localStorage for admin
  const saveCustomDesignToAdmin = (designItem) => {
    try {
      // Get existing custom designs from localStorage
      const existingDesigns = JSON.parse(localStorage.getItem('driftwear_custom_designs') || '[]');
      
      // Add new design with admin metadata
      const designWithAdminData = {
        ...designItem,
        adminId: `custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'custom_design',
        customer: currentUser?.name || 'Unknown Customer',
        customerEmail: currentUser?.email || 'No email',
        designPreview: designItem.image,
        productType: selectedProduct,
        designSide: currentPage
      };
      
      existingDesigns.push(designWithAdminData);
      localStorage.setItem('driftwear_custom_designs', JSON.stringify(existingDesigns));
      
      console.log('Custom design saved for admin:', designWithAdminData);
      return designWithAdminData;
    } catch (error) {
      console.error('Error saving custom design to admin:', error);
      return designItem;
    }
  };

  useEffect(() => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    const initFabric = () => {
      const fabric = window.fabric;
      if (!fabric) {
        console.error('Fabric.js not loaded');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js';
        script.onload = () => {
          console.log('Fabric.js loaded successfully');
          setFabricLoaded(true);
          initializeCanvas();
        };
        script.onerror = () => {
          console.error('Failed to load Fabric.js');
        };
        document.head.appendChild(script);
      } else {
        setFabricLoaded(true);
        initializeCanvas();
      }
    };

    const initializeCanvas = () => {
      const fabric = window.fabric;
      if (!fabric) {
        console.error('Fabric.js still not available');
        return;
      }

      try {
        const newCanvas = new fabric.Canvas('designCanvas', {
          width: 600,
          height: 700,
          selection: true,
          preserveObjectStacking: true,
          isDrawingMode: false
        });

        setCanvas(newCanvas);
        loadBaseImage(newCanvas);

        // Set up event listeners
        newCanvas.on('selection:created', handleSelection);
        newCanvas.on('selection:updated', handleSelection);
        newCanvas.on('selection:cleared', handleSelectionCleared);
        newCanvas.on('mouse:down', handleMouseDown);
        newCanvas.on('mouse:move', handleMouseMove);
        newCanvas.on('mouse:up', handleMouseUp);

        // Add keyboard event listeners
        document.addEventListener('keydown', handleKeyDown);

        // Add touch event listeners for mobile gestures
        const canvasElement = newCanvas.getElement();
        canvasElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvasElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvasElement.addEventListener('touchend', handleTouchEnd, { passive: false });

        console.log('Canvas initialized successfully');
      } catch (error) {
        console.error('Error initializing canvas:', error);
      }
    };

    initFabric();

    return () => {
      if (canvas) {
        canvas.dispose();
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (canvas && fabricLoaded) {
      loadBaseImage(canvas);
    }
  }, [selectedProduct, currentPage, productColor, fabricLoaded]);

  // Improved image loading
  const loadBaseImage = async (canvasObj) => {
    if (!selectedProduct || !window.fabric) return;
    
    const fabric = window.fabric;
    setImageLoading(true);
    setImageError(false);
    
    // Clear canvas
    canvasObj.clear();
    
    const imagePath = productImages[selectedProduct]?.[currentPage];
    console.log('Loading image from:', imagePath);
    
    // Test if image exists first
    const imageExists = await testImageExists(imagePath);
    console.log(`Image exists: ${imageExists} for path: ${imagePath}`);
    
    if (imagePath && imageExists) {
      // Create image element
      const imgElement = new Image();
      
      imgElement.onload = () => {
        try {
          const fabricImg = new fabric.Image(imgElement, {
            left: canvasObj.width / 2,
            top: canvasObj.height / 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            name: 'baseProduct'
          });
          
          // Scale image to fit canvas
          const scale = Math.min(500 / fabricImg.width, 600 / fabricImg.height);
          fabricImg.set({
            scaleX: scale,
            scaleY: scale
          });
          
          canvasObj.add(fabricImg);
          canvasObj.renderAll();
          setImageLoading(false);
          console.log('Image loaded successfully onto canvas');
        } catch (error) {
          console.log('Error adding image to canvas:', error);
          setImageError(true);
          createFallbackProduct(canvasObj);
          setImageLoading(false);
        }
      };
      
      imgElement.onerror = () => {
        console.log('Image load failed, creating fallback');
        setImageError(true);
        createFallbackProduct(canvasObj);
        setImageLoading(false);
      };
      
      // Set src after setting up event handlers
      imgElement.src = imagePath;
      
    } else {
      console.log('No image path found or image missing, creating fallback');
      setImageError(true);
      createFallbackProduct(canvasObj);
      setImageLoading(false);
    }
  };

  const createFallbackProduct = (canvasObj) => {
    const fabric = window.fabric;
    if (!fabric) return;
    
    // Create a colored rectangle as fallback
    const colors = {
      tshirt: '#3498db',
      pants: '#27ae60', 
      sneakers: '#e74c3c'
    };
    
    const rect = new fabric.Rect({
      width: 300,
      height: 400,
      fill: colors[selectedProduct] || productColor,
      stroke: '#666',
      strokeWidth: 2,
      left: canvasObj.width / 2,
      top: canvasObj.height / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      name: 'baseProduct'
    });
    canvasObj.add(rect);
    
    // Add product name text
    const text = new fabric.Text(`${selectedProduct.toUpperCase()} - ${currentPage.toUpperCase()}`, {
      left: canvasObj.width / 2,
      top: canvasObj.height / 2,
      originX: 'center',
      originY: 'center',
      fill: '#fff',
      fontSize: 20,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      selectable: false,
      evented: false
    });
    canvasObj.add(text);
    
    // Add "Image Not Found" text
    const errorText = new fabric.Text('(Image Not Found)', {
      left: canvasObj.width / 2,
      top: canvasObj.height / 2 + 40,
      originX: 'center',
      originY: 'center',
      fill: '#fff',
      fontSize: 14,
      fontFamily: 'Arial',
      selectable: false,
      evented: false
    });
    canvasObj.add(errorText);
    
    canvasObj.renderAll();
  };

  const handleSelection = (e) => {
    const selected = e.selected ? e.selected[0] : null;
    setSelectedObject(selected);
  };

  const handleSelectionCleared = () => {
    setSelectedObject(null);
  };

  const handleMouseDown = (e) => {
    if (!canvas) return;
    
    if (drawingMode === 'draw') {
      setIsDrawing(true);
      const brush = new window.fabric.PencilBrush(canvas);
      brush.width = 5;
      brush.color = '#000000';
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
    } else if (drawingMode === 'erase') {
      const pointer = canvas.getPointer(e.e);
      const objects = canvas.getObjects();
      
      objects.forEach(obj => {
        if (obj.name !== 'baseProduct' && obj.containsPoint(pointer)) {
          canvas.remove(obj);
        }
      });
      canvas.renderAll();
    } else {
      canvas.isDrawingMode = false;
    }
  };

  const handleMouseMove = (e) => {
    // Drawing logic handled by fabric.js
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleKeyDown = (e) => {
    if (!canvas || !selectedObject) return;

    // Delete key
    if (e.key === 'Delete' || e.key === 'Del') {
      deleteSelectedObject();
    }
  };

  const deleteSelectedObject = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      canvas.discardActiveObject();
      canvas.remove(...activeObjects);
      canvas.renderAll();
      setSelectedObject(null);
    }
  };

  const addShape = (shapeType) => {
    if (!canvas || !window.fabric) return;

    const fabric = window.fabric;
    let shape;

    switch (shapeType) {
      case 'circle':
        shape = new fabric.Circle({
          radius: 50,
          fill: '#000000',
          left: 100,
          top: 100
        });
        break;
      case 'square':
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          fill: '#000000',
          left: 100,
          top: 100
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          width: 100,
          height: 100,
          fill: '#000000',
          left: 100,
          top: 100
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const addText = () => {
    if (!canvas || !window.fabric) return;

    const fabric = window.fabric;

    const text = new fabric.Textbox('Your Text Here', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 30,
      fill: '#000000',
      fontFamily: 'Arial',
      editable: true
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // Improved graphic loading
  const addGraphic = (graphicPath) => {
    if (!canvas || !window.fabric) return;

    const fabric = window.fabric;
    
    // Create image element
    const imgElement = new Image();
    
    imgElement.onload = () => {
      try {
        const fabricImg = new fabric.Image(imgElement, {
          left: canvas.width / 2,
          top: canvas.height / 2,
          scaleX: 0.3,
          scaleY: 0.3,
          originX: 'center',
          originY: 'center'
        });
        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.renderAll();
        console.log('Graphic added successfully');
      } catch (error) {
        console.error('Error adding graphic:', error);
      }
    };
    
    imgElement.onerror = () => {
      console.error('Failed to load graphic:', graphicPath);
    };
    
    imgElement.src = graphicPath;
  };

  const uploadImage = (event) => {
    const file = event.target.files[0];
    if (!file || !canvas || !window.fabric) return;

    const fabric = window.fabric;
    const reader = new FileReader();
    reader.onload = (e) => {
      fabric.Image.fromURL(e.target.result, (img) => {
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          scaleX: 0.5,
          scaleY: 0.5,
          originX: 'center',
          originY: 'center'
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const deleteSelected = () => {
    deleteSelectedObject();
  };

  // Touch gesture handlers for mobile support
  const getTouchDistance = (touch1, touch2) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture started
      e.preventDefault();
      setIsPinching(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getTouchDistance(touch1, touch2);
      setInitialDistance(distance);

      // Get current scale of selected object or canvas
      if (selectedObject) {
        setInitialScale(selectedObject.scaleX || 1);
      }
    } else if (e.touches.length === 1) {
      // Single touch - handle double tap for selection
      const now = Date.now();
      if (now - lastTouchEnd < 300) {
        // Double tap detected
        e.preventDefault();
        const touch = e.touches[0];
        const pointer = canvas.getPointer({ clientX: touch.clientX, clientY: touch.clientY });
        const objects = canvas.getObjects();

        // Find object under touch
        for (let i = objects.length - 1; i >= 0; i--) {
          if (objects[i].containsPoint(pointer) && objects[i].name !== 'baseProduct') {
            canvas.setActiveObject(objects[i]);
            canvas.renderAll();
            break;
          }
        }
      }
      setLastTouchEnd(now);
    }
  };

  const handleTouchMove = (e) => {
    if (isPinching && e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = getTouchDistance(touch1, touch2);

      if (initialDistance > 0) {
        const scale = (distance / initialDistance) * initialScale;
        const clampedScale = Math.max(0.1, Math.min(3, scale)); // Limit scale between 0.1 and 3

        if (selectedObject) {
          selectedObject.set({
            scaleX: clampedScale,
            scaleY: clampedScale
          });
          canvas.renderAll();
        }
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (isPinching) {
      setIsPinching(false);
      setInitialDistance(0);
      setInitialScale(1);
    }
  };

  const saveDesign = () => {
    if (!canvas || !currentUser) {
      alert('Please log in to save designs');
      return;
    }

    const designData = canvas.toJSON();
    const designName = prompt('Enter a name for your design:');
    if (designName) {
      console.log('Saving design:', designName, designData);
      alert('Design saved successfully!');
    }
  };

  // UPDATED: Download Design - Now automatically adds to cart and saves to admin
  const downloadDesign = () => {
    if (!canvas) return;
    
    // Check if there are any design elements (excluding base product)
    const designElements = canvas.getObjects().filter(obj => obj.name !== 'baseProduct');
    if (designElements.length === 0) {
      alert('Please add some design elements before downloading.');
      return;
    }

    if (!currentUser) {
      alert('Please log in to download and add to cart');
      return;
    }

    const designName = prompt('Enter a name for your design:');
    if (!designName) return;

    // Generate design preview
    const designPreview = canvas.toDataURL({
      format: 'png',
      quality: 0.8
    });

    // Create custom design item
    const customDesignItem = {
      id: `custom-${Date.now()}`,
      name: `${designName} (Custom ${selectedProduct.charAt(0).toUpperCase() + selectedProduct.slice(1)})`,
      description: `Custom ${selectedProduct} design created by user`,
      price: productPrices[selectedProduct] || 3000,
      quantity: 1,
      image: designPreview,
      type: 'custom',
      productType: selectedProduct,
      designData: canvas.toJSON(),
      size: 'Custom',
      color: 'Custom Design',
      customDesign: true,
      designName: designName,
      designDescription: `Custom ${selectedProduct} design`
    };

    // Save to admin system
    const designWithAdminData = saveCustomDesignToAdmin(customDesignItem);

    // Add to cart
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      let cart = [];
      
      if (userData.id) {
        cart = JSON.parse(localStorage.getItem(`driftwear_cart_${userData.id}`) || '[]');
      } else {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
      }

      // Add the custom design to cart
      cart.push(designWithAdminData);
      
      if (userData.id) {
        localStorage.setItem(`driftwear_cart_${userData.id}`, JSON.stringify(cart));
      } else {
        localStorage.setItem('cart', JSON.stringify(cart));
      }

      // Now download the design
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0
      });
      
      const link = document.createElement('a');
      link.download = `design-${selectedProduct}-${currentPage}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Design downloaded and added to cart successfully! The admin has been notified of your custom design.');
      
      // Optionally navigate to cart
      const goToCart = confirm('Design downloaded and added to cart! Would you like to view your cart?');
      if (goToCart) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error adding custom design to cart:', error);
      alert('Failed to add design to cart. Please try again.');
    }
  };

  if (!fabricLoaded) {
    return (
      <div className="designer-tool">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading designer...</span>
          </div>
          <p className="mt-3">Loading design tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="designer-tool">
      <div className="designer-container">
        {/* Tools Panel */}
        <div className="tools-panel">
          <h3>Design Tools</h3>
          
          <div className="mb-3">
            <label className="form-label">Current Product:</label>
            <div className="current-product-display">
              <strong>{selectedProduct.charAt(0).toUpperCase() + selectedProduct.slice(1)}</strong>
              <div className="product-price">
                ₱{productPrices[selectedProduct]?.toLocaleString() || '3,000'}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Design Side:</label>
            <select 
              className="form-select" 
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
            >
              <option value="front">Front</option>
              <option value="back">Back</option>
              <option value="left">Left Side</option>
              <option value="right">Right Side</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Mode:</label>
            <div className="btn-group w-100" role="group">
              <button 
                type="button" 
                className={`btn ${drawingMode === 'select' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setDrawingMode('select')}
              >
                Select
              </button>
              <button 
                type="button" 
                className={`btn ${drawingMode === 'draw' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setDrawingMode('draw')}
              >
                Draw
              </button>
              <button 
                type="button" 
                className={`btn ${drawingMode === 'erase' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setDrawingMode('erase')}
              >
                Eraser
              </button>
            </div>
          </div>

          <div className="mb-3">
            <button className="btn btn-primary w-100 mb-2" onClick={addText}>
              Add Text
            </button>
          </div>

          <div className="mb-3">
            <label className="form-label">Shapes:</label>
            <div className="d-grid gap-2">
              <button className="btn btn-outline-secondary" onClick={() => addShape('circle')}>Circle</button>
              <button className="btn btn-outline-secondary" onClick={() => addShape('square')}>Square</button>
              <button className="btn btn-outline-secondary" onClick={() => addShape('triangle')}>Triangle</button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Graphics:</label>
            <select 
              className="form-select mb-2" 
              onChange={(e) => e.target.value && addGraphic(e.target.value)}
            >
              <option value="">Select a graphic</option>
              {graphics.map((graphic, index) => (
                <option key={index} value={graphic.file_path}>
                  {graphic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Upload Image:</label>
            <input 
              type="file" 
              className="form-control" 
              onChange={uploadImage}
              accept="image/*"
            />
          </div>

          <div className="mb-3">
            <button className="btn btn-danger w-100 mb-2" onClick={deleteSelected}>
              Delete Selected
            </button>
            <button className="btn btn-success w-100 mb-2" onClick={saveDesign}>
              Save Design
            </button>
            
            {/* UPDATED: Download Design button now automatically adds to cart and saves to admin */}
            <button className="btn btn-info w-100 mb-2" onClick={downloadDesign}>
              <i className="fas fa-download me-2"></i>
              Download & Add to Cart - ₱{productPrices[selectedProduct]?.toLocaleString() || '3,000'}
            </button>
            
            <button className="btn btn-secondary w-100" onClick={onBackToSelection}>
              <i className="fas fa-arrow-left me-2"></i>Back to Products
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="canvas-area">
          <div className="page-indicator">
            <h4>{selectedProduct.charAt(0).toUpperCase() + selectedProduct.slice(1)} - {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</h4>
            {imageError && (
              <div className="alert alert-warning mt-2" role="alert">
                <small>⚠️ Product image not found. Using placeholder.</small>
              </div>
            )}
          </div>
          
          {imageLoading && (
            <div className="canvas-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading product image...</span>
              </div>
              <p className="mt-2">Loading product image...</p>
            </div>
          )}
          
          <div className="canvas-container">
            <canvas 
              id="designCanvas" 
              width="600" 
              height="700"
              ref={canvasRef}
            ></canvas>
          </div>
          
          <div className="canvas-help mt-2">
            <small className="text-muted">Click and drag to move objects. Use handles to resize.</small>
          </div>
        </div>
      </div>
    </div>
  );
}

// Premade Tool Component
function PremadeTool({ currentUser, openAuthModal }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [productType, setProductType] = useState('tshirt');
  const [designName, setDesignName] = useState('');
  const [designDescription, setDesignDescription] = useState('');
  const navigate = useNavigate();

  // Product prices for premade designs
  const productPrices = {
    tshirt: 3000,
    pants: 3200,
    sneakers: 3800
  };

  // Function to save premade designs to localStorage for admin
  const savePremadeDesignToAdmin = (designItem) => {
    try {
      // Get existing custom designs from localStorage
      const existingDesigns = JSON.parse(localStorage.getItem('driftwear_custom_designs') || '[]');
      
      // Add new design with admin metadata
      const designWithAdminData = {
        ...designItem,
        adminId: `premade-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'premade_design',
        customer: currentUser?.name || 'Unknown Customer',
        customerEmail: currentUser?.email || 'No email',
        designPreview: designItem.image,
        productType: productType,
        designFile: designItem.designFile
      };
      
      existingDesigns.push(designWithAdminData);
      localStorage.setItem('driftwear_custom_designs', JSON.stringify(existingDesigns));
      
      console.log('Premade design saved for admin:', designWithAdminData);
      return designWithAdminData;
    } catch (error) {
      console.error('Error saving premade design to admin:', error);
      return designItem;
    }
  };

  useEffect(() => {
    if (!currentUser) {
      openAuthModal('login');
    }
  }, [currentUser, openAuthModal]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // UPDATED: Form submission - saves to admin and adds to cart
  const addPremadeDesignToCart = (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Please log in to purchase designs');
      return;
    }

    if (!selectedFile) {
      alert('Please select a design file');
      return;
    }

    if (!designName.trim()) {
      alert('Please enter a design name');
      return;
    }

    // Create premade design item
    const premadeDesignItem = {
      id: `premade-${Date.now()}`,
      name: `${designName} (Premade ${productType.charAt(0).toUpperCase() + productType.slice(1)})`,
      description: designDescription,
      price: productPrices[productType] || 3000,
      quantity: 1,
      image: previewUrl,
      type: 'premade',
      productType: productType,
      designFile: selectedFile.name,
      size: 'Standard',
      color: 'As Designed',
      customDesign: true,
      designName: designName,
      designDescription: designDescription,
      premadeDesign: true
    };

    // Save to admin system
    const designWithAdminData = savePremadeDesignToAdmin(premadeDesignItem);

    // Add to cart
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      let cart = [];
      
      if (userData.id) {
        cart = JSON.parse(localStorage.getItem(`driftwear_cart_${userData.id}`) || '[]');
      } else {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
      }

      // Add the premade design to cart
      cart.push(designWithAdminData);
      
      if (userData.id) {
        localStorage.setItem(`driftwear_cart_${userData.id}`, JSON.stringify(cart));
      } else {
        localStorage.setItem('cart', JSON.stringify(cart));
      }

      // Reset form and show success message
      setSelectedFile(null);
      setPreviewUrl('');
      setDesignName('');
      setDesignDescription('');
      
      alert('Premade design added to cart successfully! The admin has been notified of your design.');
      
      // Optionally navigate to cart
      const goToCart = confirm('Design added to cart! Would you like to view your cart?');
      if (goToCart) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error adding premade design to cart:', error);
      alert('Failed to add design to cart. Please try again.');
    }
  };

  return (
    <div className="premade-tool">
      <div className="premade-form">
        <form onSubmit={addPremadeDesignToCart}>
          <div className="mb-4">
            <label className="form-label fw-bold">Upload Your Design:</label>
            <div className="upload-area">
              <input 
                type="file" 
                className="form-control" 
                onChange={handleFileSelect}
                accept=".png,.jpg,.jpeg,.pdf"
                required
              />
              {previewUrl && (
                <div className="preview-container mt-3">
                  <img src={previewUrl} alt="Design preview" className="preview-image" />
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold">Product Type:</label>
            <div className="row">
              <div className="col-md-4 mb-3">
                <div className="product-option">
                  <input 
                    type="radio" 
                    id="tshirtType" 
                    name="productType" 
                    value="tshirt"
                    checked={productType === 'tshirt'}
                    onChange={(e) => setProductType(e.target.value)}
                    className="btn-check"
                  />
                  <label className="btn btn-outline-primary w-100" htmlFor="tshirtType">
                    <i className="fas fa-tshirt me-2"></i>T-Shirt
                  </label>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="product-option">
                  <input 
                    type="radio" 
                    id="pantsType" 
                    name="productType" 
                    value="pants"
                    checked={productType === 'pants'}
                    onChange={(e) => setProductType(e.target.value)}
                    className="btn-check"
                  />
                  <label className="btn btn-outline-success w-100" htmlFor="pantsType">
                    <i className="fas fa-tshirt me-2"></i>Pants
                  </label>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="product-option">
                  <input 
                    type="radio" 
                    id="sneakersType" 
                    name="productType" 
                    value="sneakers"
                    checked={productType === 'sneakers'}
                    onChange={(e) => setProductType(e.target.value)}
                    className="btn-check"
                  />
                  <label className="btn btn-outline-info w-100" htmlFor="sneakersType">
                    <i className="fas fa-shoe-prints me-2"></i>Sneakers
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="designName" className="form-label fw-bold">Design Name:</label>
            <input 
              type="text" 
              className="form-control" 
              id="designName"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="Give your design a name"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="designDescription" className="form-label fw-bold">Design Description:</label>
            <textarea 
              className="form-control" 
              id="designDescription"
              value={designDescription}
              onChange={(e) => setDesignDescription(e.target.value)}
              placeholder="Describe your design (optional)"
              rows="3"
            />
          </div>

          <div className="price-summary mb-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Order Summary</h5>
                <div className="d-flex justify-content-between">
                  <span>Premade {productType.charAt(0).toUpperCase() + productType.slice(1)} Design</span>
                  <span className="fw-bold">₱{productPrices[productType]?.toLocaleString() || '3,000'}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <h5>Total:</h5>
                  <h4 className="text-primary">₱{productPrices[productType]?.toLocaleString() || '3,000'}</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button type="submit" className="btn btn-primary btn-lg px-5">
              <i className="fas fa-shopping-cart me-2"></i>
              Add to Cart - ₱{productPrices[productType]?.toLocaleString() || '3,000'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Customization;