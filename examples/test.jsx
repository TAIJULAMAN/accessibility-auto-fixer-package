import React from 'react';

function TestComponent() {
  return (
    <div>
      <img src="logo.png" />
      <button onClick={handleClick}>Click me</button>
      <input type="text" />
      <button>Submit Form</button>
      
      <div role="button" onClick={handleClick}>
        Custom Button
      </div>
      
      <div role="invalidrole">
        Invalid Role
      </div>
    </div>
  );
}

export default TestComponent;

