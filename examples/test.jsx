import React from 'react';

function TestComponent() {
  return (
    <div>
      <img src="logo.png" alt="" />
      <button onClick={handleClick} type="button">Click me</button>
      <input type="text" aria-label="Input field" />
      <button type="button">Submit Form</button>
      
      <div role="button" onClick={handleClick}>
        Custom Button
      </div>
      
      <div role="invalidrole">
        Invalid Role
      </div>
    </div>);

}

export default TestComponent;