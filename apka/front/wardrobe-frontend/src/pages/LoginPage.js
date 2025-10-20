import React, { useContext, useState } from 'react';
import { AppContext } from "../context/AppContext";
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

function LoginPage() {
  const { user, setUser, setWardrobe} = useContext(AppContext);
  const [tempUser, setTempUser] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [newUser, setNewUser] = useState(false)
  const [error, setError] = useState('')

//   const dummy = async () => {};
  const handleLogin = async () => {
    // kiedy nie ma numeru wpisanego
    if (!tempUser) return alert("Please enter a user ID");

    try {
      let response = await fetch(`http://localhost:8000/users/${tempUser}`)
      if (!response.ok) {
        setError(`User ${tempUser} does not exist`)
        throw new Error(`User ${tempUser} does not exist`);
      }
      const user_db = await response.json();
      if (user_db.password !== tempPassword) {
        setError("Wrong password!")
        throw new Error(`Wrong password!`);
      }
      setUser(user_db);

      // dane z tabeli wardrobe dla usera z danym user_id
      response = await fetch(`http://localhost:8000/wardrobe?user_id=${tempUser}`);
      if (!response.ok){
        setError("Failed to fetch wardrobe")
        throw new Error("Failed to fetch wardrobe");
      }

      const data = await response.json();
      setWardrobe(data.items);
    } catch (err) {
      console.error("Error loading wardrobe:", err);
      alert(error);
    }
  };

  const addUser = async () => {
  try {
    const response = await fetch("http://localhost:8000/add_user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        surname: surname,
        password: tempPassword,
      }),
    });

    if (!response.ok) throw new Error("Failed to add user");

    const data = await response.json();
    console.log("✅ User added:", data);

    alert(`User created successfully!\n [!!!] YOUR USER ID: ${data.user_id}`);
    setNewUser(false)
  } catch (err) {
    console.error("❌ Error adding user:", err);
    alert("Failed to add user.");
  }
};


  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Logowanie</h1>

      <div className="mb-4">
        <Label>User id</Label>
        <Input
          type="number"
          value={tempUser}
          onChange={e => setTempUser(e.target.value)}
          className="mt-1"
        />
      </div>
      <div className="mb-4">
        <Label>Password</Label>
        <Input
          type="text"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
          className="mt-1"
        />
      </div>
      <Button onClick= {handleLogin} style={{margin: '1px' }}>Submit</Button>
      <Button onClick= {() => setNewUser(true)} style={{margin: '1px' }}>Create New Account</Button>
      {newUser && 
      <div>
        <div className="mb-4">
          <Label>Name</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="mb-4">
          <Label>Surname</Label>
          <Input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="mb-4">
          <Label>Password</Label>
          <Input
            type="text"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button onClick= {addUser} style={{margin: '1px' }}>Submit</Button>
      </div>
      }

      {user && <p className="mt-2">Current user: {user.user_id}</p>}
    </div>
  );
}

export default LoginPage;
