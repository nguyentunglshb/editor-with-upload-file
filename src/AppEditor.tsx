import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import React from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

type EditorProps = {
  placeholder: string;
  onEditorChange: (values: string) => void;
  onFilesChange: (files: File[]) => void;
};

type EditorState = {
  editorHtml: string;
  files: File[];
};

const QuillClipboard = Quill.import("modules/clipboard");

class Clipboard extends QuillClipboard {
  getMetaTagElements = (stringContent: string) => {
    const el = document.createElement("div");
    el.innerHTML = stringContent;
    return el.getElementsByTagName("meta");
  };

  async onPaste(e: any) {
    let clipboardData = e.clipboardData || (window as any).clipboardData;
    let pastedData = await clipboardData.getData("Text");

    const urlMatches = pastedData.match(/\b(http|https)?:\/\/\S+/gi) || [];
    if (urlMatches.length > 0) {
      e.preventDefault();
      urlMatches.forEach((link: string) => {
        axios
          .get(link)
          .then((payload) => {
            // let title, image, url, description;
            let title, image, url;
            for (let node of this.getMetaTagElements(payload.toString())) {
              if (node.getAttribute("property") === "og:title") {
                title = node.getAttribute("content");
              }
              if (node.getAttribute("property") === "og:image") {
                image = node.getAttribute("content");
              }
              if (node.getAttribute("property") === "og:url") {
                url = node.getAttribute("content");
              }
              // if (node.getAttribute("property") === "og:description") {
              //     description = node.getAttribute("content");
              // }
            }

            const rendered = `<a href=${url} target="_blank"><div><img src=${image} alt=${title} width="20%"/><span>${title}</span></div></a>`;

            let range = this.quill.getSelection();
            let position = range ? range.index : 0;
            this.quill.pasteHTML(position, rendered, "silent");
            this.quill.setSelection(position + rendered.length);
          })
          .catch((error) => console.error(error));
      });
    } else {
      //console.log('when to use this') 보통 다른 곳에서  paste 한다음에  copy하면 이쪽 걸로 한다.
      super.onPaste(e);
    }
  }
}
Quill.register("modules/clipboard", Clipboard, true);

const BlockEmbed = Quill.import("blots/block/embed");

class ImageBlot extends BlockEmbed {
  static create(value: any) {
    const imgTag = super.create();
    imgTag.setAttribute("src", value.src);
    imgTag.setAttribute("alt", value.alt);
    imgTag.setAttribute("width", "100%");
    return imgTag;
  }

  static value(node: any) {
    return { src: node.getAttribute("src"), alt: node.getAttribute("alt") };
  }
}

ImageBlot.blotName = "image";
ImageBlot.tagName = "img";
Quill.register(ImageBlot);

export default class AppEditor extends React.Component<
  EditorProps,
  EditorState
> {
  // bandId;
  placeholder: string = "";
  onEditorChange: any;
  onFilesChange: any;
  // onPollsChange;
  _isMounted: boolean = false;

  private inputOpenImageRef: React.RefObject<any>;
  private reactQuillRef: any;

  constructor(props: EditorProps) {
    super(props);

    this.state = {
      editorHtml: "<p>&nbsp;</p>",
      files: [],
    };

    this.reactQuillRef = null;

    this.inputOpenImageRef = React.createRef();
    // this.inputOpenVideoRef = React.createRef();
    // this.inputOpenFileRef = React.createRef();
  }

  componentDidMount(): void {
    this._isMounted = true;
  }

  componentWillUnmount(): void {
    this._isMounted = false;
  }

  handleChange = (html: string) => {
    console.log("html: ", html);

    this.setState(
      {
        editorHtml: html,
      },
      () => {
        this.props.onEditorChange(this.state.editorHtml);
      }
    );
  };

  imageHandler = () => {
    this.inputOpenImageRef.current.click();
  };

  insertImage = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (
      e.currentTarget &&
      e.currentTarget.files &&
      e.currentTarget.files.length > 0
    ) {
      const file = e.currentTarget.files[0];

      let formData = new FormData();
      const config: AxiosRequestConfig<FormData> = {
        headers: {
          "Content-type": "multipart/form-data",
        },
      };
      formData.append("file", file);

      axios
        .post(
          "https://nest-docs-production.up.railway.app/other/upload",
          formData,
          config
        )
        .then((response) => {
          //   if (response.data.success) {
          const quill = this.reactQuillRef.getEditor();
          quill.focus();

          let range = quill.getSelection();
          let position = range ? range.index : 0;

          //먼저 노드 서버에다가 이미지를 넣은 다음에   여기 아래에 src에다가 그걸 넣으면 그게
          //이미지 블롯으로 가서  크리에이트가 이미지를 형성 하며 그걸 발류에서     src 랑 alt 를 가져간후에  editorHTML에 다가 넣는다.
          // quill.insertEmbed(position, "image", { src: "http://localhost:5000/" + response.data.url, alt: response.data.fileName });
          quill.insertEmbed(position, "image", { src: response.data });
          quill.setSelection(position + 1);

          if (this._isMounted) {
            this.setState(
              {
                files: [...this.state.files, file],
              },
              () => {
                this.props.onFilesChange(this.state.files);
              }
            );
          }
          //   } else {
          // return alert("failed to upload file");
          //   }
        });
    }
  };

  render() {
    return (
      <div>
        <div id="toolbar">
          <select
            className="ql-header"
            defaultValue={""}
            onChange={(e) => e.persist()}
          >
            <option value="1" />
            <option value="2" />
            <option value="" />
          </select>
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
          <button className="ql-insertImage">I</button>
          <button className="ql-insertVideo">V</button>
          <button className="ql-insertFile">F</button>
          <button className="ql-link" />
          <button className="ql-code-block" />
          <button className="ql-video" />
          <button className="ql-blockquote" />
          <button className="ql-clean" />
        </div>
        <ReactQuill
          ref={(el) => {
            this.reactQuillRef = el;
          }}
          theme={"snow"}
          onChange={this.handleChange}
          modules={this.modules}
          formats={this.formats}
          value={this.state.editorHtml}
          placeholder={this.props.placeholder}
        />
        <input
          type="file"
          accept="image/*"
          ref={this.inputOpenImageRef}
          style={{ display: "none" }}
          onChange={this.insertImage}
        />
        {/* <input
          type="file"
          accept="video/*"
          ref={this.inputOpenVideoRef}
          style={{ display: "none" }}
          onChange={this.insertVideo}
        />
        <input
          type="file"
          accept="*"
          ref={this.inputOpenFileRef}
          style={{ display: "none" }}
          onChange={this.insertFile}
        /> */}
      </div>
    );
  }

  modules = {
    syntax: false,
    toolbar: {
      container: "#toolbar",
      //id ="toorbar"는  그 위에 B I U S I V F P 이거 있는 곳이다.
      handlers: {
        insertImage: this.imageHandler,
        // insertVideo: this.videoHandler,
        // insertFile: this.fileHandler,
        // insertPoll: this.pollHandler,
      },
    },
  };

  formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "image",
    "video",
    "file",
    "link",
    "code-block",
    "video",
    "blockquote",
    "clean",
  ];
}
