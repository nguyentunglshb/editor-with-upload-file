import axios from "axios";
import React, { useEffect, useState } from "react";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);

  const getAllBlogs = async () => {
    try {
      const res = await axios("http://localhost:3000/blogs");
      setBlogs(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllBlogs();
  }, []);

  return (
    <div>
      {blogs.length &&
        blogs.map((blog: any) => (
          <div key={blog._id}>
            <div className="title">{blog.title}</div>
            <div className="createdAt">{blog.createdAt}</div>
            <div
              className="content"
              dangerouslySetInnerHTML={{
                __html: blog.content,
              }}
            ></div>
          </div>
        ))}
    </div>
  );
};

export default Blog;
