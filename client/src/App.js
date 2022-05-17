import { React, useState } from "react";
import TextField from "@mui/material/TextField";
import "./App.css";
import { Button, Alert, Fade } from "@mui/material";
import axios from "axios";

function App() {
  /* Creating a state for each of the variables. */
  const [urlInput, setURL] = useState("");
  const [state, setState] = useState("");
  const [infoVisibility, setInfoVis] = useState(false);
  const [searchVis, setSearchVis] = useState(false);
  const [alertState, setAlertState] = useState("info");
  const [searchValue, setSearchValue] = useState("");

  /**
   * `onWaitingForResponse()` is called when the user clicks the "Send" button. It sets the alert state
   * to "info", the message to "waiting for response", and makes the info div visible.
   */
  function onWaitingForResponse() {
    setAlertState("info");
    setState("waiting for response");
    setInfoVis(true);
  }

  /**
   * It sets the state of the alert to "Done!" and makes the new search bar visible. It also sets the
   * alert state to "success" and after 5 seconds, it makes the info box invisible
   */
  function onGotResponse() {
    setState("Done!");
    setSearchVis(true);
    setAlertState("success");
    setTimeout(() => {
      setInfoVis(false);
    }, 5000);
  }

  /**
   * The function takes the urlInput from the user and sends it to the backend
   */
  function onSubmit() {
    const urlData = {
      url: urlInput,
    };
    axios
      .post("http://localhost:3001/load", urlData)
      .then((res) => {
        onGotResponse();
      })
      .catch((err) => alert(err));
  }

  /* Returning the JSX code that is rendered on the screen. */
  return (
    <div className="main">
      <h1>React Search</h1>
      <div className="search">
        <TextField
          id="outlined-basic"
          variant="outlined"
          fullWidth
          label="search"
          onChange={(e) => setURL(e.target.value)}
          value={urlInput}
        />
      </div>
      <div className="searchButton">
        <Button
          variant="contained"
          onClick={() => {
            onSubmit();
            onWaitingForResponse();
          }}
        >
          Submit
        </Button>
      </div>
      <div className="responseArea">
        <Fade in={infoVisibility}>
          <Alert severity={alertState}>{state}</Alert>
        </Fade>
      </div>
      <div className="search">
        <Fade in={searchVis}>
          <TextField
            id="outlined-basic-2"
            variant="outlined"
            fullWidth
            label="search"
            onChange={(e) => setSearchValue(e.target.value)}
            value={searchValue}
          ></TextField>
        </Fade>
      </div>
    </div>
  );
}

export default App;
