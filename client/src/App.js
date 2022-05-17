import { React, useState } from "react";
import TextField from "@mui/material/TextField";
import "./App.css";
import { Button, Alert, Fade } from "@mui/material";
import axios from "axios";

function App() {
  /**
   * It takes a list as an argument and returns a list item for each item in the list
   * @param list - The array of items to be rendered.
   * @returns A list of items
   */
  const ListRender = () => {
    return (
      <ol>
        {listData.map((listItem) => (
          <li key={listItem[0]}>
            {listItem[0]}, {listItem[1]}
          </li>
        ))}
      </ol>
    );
  };

  /* Creating a state for each of the variables. */
  const [urlInput, setURL] = useState("");
  const [state, setState] = useState("");
  const [infoVisibility, setInfoVis] = useState(false);
  const [searchVis, setSearchVis] = useState(false);
  const [alertState, setAlertState] = useState("info");
  const [searchPhrase, setSearchPhrase] = useState("");
  const [listState, setListState] = useState(false);
  const [listData, setListData] = useState([1, 2]);
  /**
   * The function takes the search phrase from the input field and sends it to the server
   */
  function search() {
    const phraseData = {
      phrase: searchPhrase,
    };
    axios
      .post("http://localhost:3001/search", phraseData)
      .then((res) => {
        onGetSearchData(res.data.data);
      })
      .catch((err) => {
        alert(err);
      });
  }

  function onGetSearchData(result) {
    setListData(result);
    setListState(true);
  }

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
  function onSubmitUrl() {
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
      <div className="urlInput">
        <TextField
          id="outlined-basic"
          variant="outlined"
          fullWidth
          label="search"
          onChange={(e) => setURL(e.target.value)}
          value={urlInput}
        />
      </div>
      <div className="urlButton">
        <Button
          variant="contained"
          onClick={() => {
            onSubmitUrl();
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
            onChange={(e) => setSearchPhrase(e.target.value)}
            value={searchPhrase}
          ></TextField>
        </Fade>
      </div>
      <div className="searchButton">
        <Fade in={searchVis}>
          <Button
            variant="contained"
            onClick={() => {
              search();
            }}
          >
            Submit
          </Button>
        </Fade>
      </div>
      <div className="searchResults">
        {listState && <ListRender></ListRender>}
      </div>
    </div>
  );
}

export default App;
