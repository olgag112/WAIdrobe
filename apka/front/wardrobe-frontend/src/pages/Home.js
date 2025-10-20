import React, { useContext, useState } from 'react';
import { AppContext } from "../context/AppContext";
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

function Home() {
  const {user} = useContext(AppContext);

  const dummy = async () => {};

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">{`Hej ${user.name}`}</h1>
    </div>
  );
}

export default Home;
