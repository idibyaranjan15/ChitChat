import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, HStack, VStack } from "@chakra-ui/react";
import Messages from './Components/Message';
import { onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { app } from "./firebase";
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
}

const logOutHandler = () => {
  signOut(auth);
}

const App = () => {
 
  const [user, setUser] = useState(false);
  const [Message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divForScroll = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      await addDoc(collection(db, "Messages"), {
        text: Message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp()
      });

      // Scroll to the last message element
      if (divForScroll.current) {
        divForScroll.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      alert(error);
    }
  }

  useEffect(() => {
    const q = query(collection(db, "Messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    const unsubscribeForMessage = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      );
    });

    return () => {
      unsubscribe();
      unsubscribeForMessage();
    };
  }, []);

  return (
    <Box bg={"red.50"}>
      {user ? (
        <Container h={"100vh"} bg={"white"}>
          <VStack h={"full"} paddingY={"4"}>
            <Button onClick={logOutHandler} colorScheme={"red"} width={"full"}>
              Logout
            </Button>
            <VStack h={"full"} w={"full"} overflow={"auto"} css={styles}>
              {messages.map(item => (
                <Messages
                  key={item.id}
                  user={item.uid === user.uid ? "me" : "other"}
                  text={item.text}
                  uri={item.uri}
                />
              ))}
              {/* Use ref on the last message element */}
              <div ref={divForScroll}></div>
            </VStack>
            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <input value={Message} onChange={(e) => setMessage(e.target.value)} placeholder='Enter A Message...' />
                <Button colorScheme={"purple"} type="submit">Send</Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack bg={"white"} h={"100vh"} justifyContent={"center"} >
          <Button onClick={loginHandler} colorScheme='green'> Sign In With Google</Button>
        </VStack>
      )}
    </Box>
  );
}

export default App;

const styles = `
  
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`;
