import React, { useState, useContext } from 'react';
import { AppContext } from "../../context/AppContext";
import { Button } from './button';


const SingleFileUploader = () => {
  const {file, setFile} = useContext(AppContext);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
    
  };

  const handleUpload = async () => {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await fetch("http://localhost:8000/upload_image", {
        method: 'POST',
        body: formData,
      });

      const data = await result.json();
      console.log("Image uploaded:", data);

      // Return the uploaded image URL
      return data.url;
    } catch (error) {
      console.error(error);
      alert("Error uploading image");
    }
  }
};


  return (
    <>
      <div className="input-group">
        <input id="file" type="file" onChange={handleFileChange} />
      </div>

      {file && (
        <section>
          <p>File details:</p>
          <ul>
            <li>Name: {file.name}</li>
            <li>Type: {file.type}</li>
            <li>Size: {(file.size/1000000).toFixed(2)} Mb</li>
          </ul>
        </section>
      )}
    </>
  );
};

export default SingleFileUploader;
