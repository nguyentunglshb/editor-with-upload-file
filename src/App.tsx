import axios from "axios";
import React, { useState } from "react";
import AppEditor from "./AppEditor";
import Blog from "./Blog";

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [content, setContent] = useState("");

  const onEditorChange = (value: string) => {
    setContent(value);
  };

  const onFilesChange = (files: File[]) => {
    setFiles(files);
  };

  const createBlog = async () => {
    try {
      const res = await axios.post("http://localhost:3000/blogs", {
        title: "default title",
        content,
      });
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
      <AppEditor
        placeholder="Start typing something"
        onEditorChange={onEditorChange}
        onFilesChange={onFilesChange}
      />
      <button onClick={createBlog}>Submit</button>
      {/* <Blog /> */}
    </div>
  );
}

export default App;
