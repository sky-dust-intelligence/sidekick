import React, { useState, useEffect, useRef } from 'react';
import { Card, Toolbar, Paper, Box, FormControl, Select, Typography, InputLabel, Tooltip, IconButton, TextField, Button, Menu, MenuItem, Divider } from '@mui/material';
import { lightBlue } from '@mui/material/colors';
import { PlayArrow } from '@mui/icons-material';
import AIPromptResponse from './AIPromptResponse';
import { use } from 'marked';
import { create } from '@mui/material/styles/createTransitions';
import AI from './AI';
import SidekickMarkdown from './SidekickMarkdown';
import ScriptTemplate from './ScriptTemplate';


const ScriptPrompt = ({ cells,
    cellName, setCellName,
    cellValue, setCellValue,
    modelSettings, serverUrl, token, setToken, darkMode, markdownRenderingOn, system }) => {
    const [myCellName, setMyCellName] = useState(cellName);
    const [myCellValue, setMyCellValue] = useState(cellValue);
    const [template, setTemplate] = useState(cellValue?.template || "");
    const [prompt, setPrompt] = useState("");
    const [userPromptToSend, setUserPromptToSend] = useState("");
    const [promptToSend, setPromptToSend] = useState(null);
    const [response, setResponse] = useState(cellValue?.response || "");
    const [AIResponse, setAIResponse] = useState("");
    const [contentDisabled, setContentDisabled] = useState(false);
    const [cellToAddToTemplate, setCellToAddToTemplate] = useState("");
    const [streamingChatResponse, setStreamingChatResponse] = useState("");
    const streamingChatResponseRef = useRef("");
    const [cellsByName, setCellsByName] = useState({});

    const listToDict = (list) => {
        list.reduce((acc, cell) => {
        acc[cell.name] = cell;
        return acc;
        }, {});
    };

    useEffect(() => {
        setCellsByName(listToDict(cells));
        createPromptFromTemplate();
    }, [cells]);

    useEffect(() => {
        setCellName(myCellName);
    }
    , [myCellName]);

    useEffect(() => {
        setCellValue(myCellValue);
    }
    , [myCellValue]);

    const createPromptFromTemplate = () => {
        // replace all the {.*} in the template with the values of the cells with those names
        let newPrompt = template;
        cells.forEach((cell) => {
            switch (cell.type.toLowerCase()) {
                case "text":
                    newPrompt = newPrompt.replace(new RegExp("\\{" + cell.name + "\\}", "gi"), cell.value);
                    break;
                case "list":
                    if (cell.value && cell.value?.cellList && cell.value.cellList?.length > 0) {
                        newPrompt = newPrompt.replace(new RegExp("\\{" + cell.name + "\\}", "gi"), "{" + 
                            cell.value.cellList.map(element => {
                                return element.value;
                            }) + "}");
                    } else {
                        newPrompt = newPrompt.replace(new RegExp("\\{" + cell.name + "\\}", "gi"),
                            "WARNING: {"+cell.name+"} IS AN EMPTY LIST");
                    }
                    break;
                case "prompt":
                    newPrompt = newPrompt.replace(new RegExp("\\{" + cell.name + "\\}", "gi"), cell.value.response);
                    break;
                default:
                    break;
            }
        }
        );
        setPrompt(newPrompt);
    }

    useEffect(() => {
        setMyCellValue({ ...myCellValue, template: template});
        createPromptFromTemplate();
    }
    , [template]);

    useEffect(()=>{
        if (AIResponse !== "") {
            setResponse(AIResponse);
            setMyCellValue({ ...myCellValue, response: AIResponse});
        }
    },[AIResponse]);

    const handleNameChange = (event) => {
        setMyCellName(event.target.value);
    }

    const handleResponseChange = (event) => {
        setMyCellValue({ ...myCellValue, response: event.target.value});
    };

    const handleAddCellToPrompt = (name) => {
        setTemplate(template + "{" + name + "}");
        setCellToAddToTemplate(""); // reset the select box
    };

    const toolbar =
        <Box sx={{ width: "100%", paddingLeft: 0, paddingRight: 0, display: "flex",
        flexDirection: "row", alignItems: "center" }}>
        <FormControl sx={{ mt: 2, width: "100%" }} size="small">
            <Select
                value={cellToAddToTemplate}
                displayEmpty
                onChange={(event) => { handleAddCellToPrompt(event.target.value); }}
                >
                    <MenuItem disabled value="">
                        <em>Select cell to add to template...</em>
                    </MenuItem>
                    {
                        cells && cells.map(
                            (cell, index) => {
                                if (cell.name === myCellName || cell.name === "") {
                                    return null;
                                }
                                return <MenuItem value={cell.name}>{cell.name}</MenuItem>
                            }
                        )
                    }
            </Select>
        </FormControl>
    </Box>;

    return (
        <Box>
            <TextField label="Name" variant="outlined" sx={{ mt: 2, width: "100%" }}
                value={myCellName} onChange={handleNameChange}
            />
            {toolbar}
            <ScriptTemplate cells={cells}
                        valueLabel="Edit the template to generate a prompt"
                        cellValue={cellValue} setCellValue={setMyCellValue}
                    />;
            <AIPromptResponse 
                serverUrl={serverUrl}
                token={token}
                setToken={setToken}
                modelSettings={modelSettings}
                streamingOn={true}
                customUserPromptReady={""}
                systemPrompt={""}
                streamingChatResponseRef={streamingChatResponseRef}
                streamingChatResponse={streamingChatResponse}
                setStreamingChatResponse={setStreamingChatResponse}
                setAIResponse={setAIResponse}
                setUserPromptEntered={null}
                interactiveMode={true}
                showPrompt={false}
                userPromptToSend={userPromptToSend}
                passiveUserPromptToSend={prompt}
                setUserPromptToSend={setUserPromptToSend}
                controlName="Ask the AI"
                toolbarButtons={null}
                sendButtonTooltip=""
                onBlur={null}
                darkMode={darkMode}
            />
            { !streamingChatResponse &&
                <Card id="response" label="Response" variant="outlined"
                        sx={{ 
                            padding: 2, 
                            width: "100%", 
                            backgroundColor: (darkMode ? lightBlue[900] : "lightyellow"),
                            cursor: "default",
                        }}
                >
                    {
                        markdownRenderingOn
                        ?
                            <SidekickMarkdown markdown={response} />
                        :
                            <Typography sx={{ whiteSpace: 'pre-wrap', width: "100%" }}>
                                {response}
                            </Typography>
                    }
                </Card>
            }
            <Box sx={{ width: "100%" }}>
                {streamingChatResponse && streamingChatResponse !== "" && 
                <Card id="streamingChatResponse" label="Response"
                    sx={{ 
                        padding: 2, 
                        width: "100%", 
                        backgroundColor: (darkMode ? lightBlue[900] : "lightyellow"),
                        cursor: "default",
                    }}
                    >
                        <Typography
                            sx={{ whiteSpace: 'pre-wrap', width: "100%" }}
                            onChange={handleResponseChange}
                        >
                            {streamingChatResponse}
                        </Typography>
                    </Card>
                }
            </Box>
        </Box>
    );
};

export default ScriptPrompt;
