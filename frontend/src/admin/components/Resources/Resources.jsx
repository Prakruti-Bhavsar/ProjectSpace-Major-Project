import React, { useState, useEffect, useCallback } from "react";
import AxiosInstance from "../../../AxiosInstance";
// import * as XLSX from "xlsx";

const ResourceManagement = ({ category, year, semester, div }) => {
  const [uploads, setUploads] = useState([]);
  const [selectedUploads, setSelectedUploads] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [linkToEdit, setLinkToEdit] = useState(null); 
  const [showAddUploadPopup, setShowAddUploadPopup] = useState(false);
  const [showEditUploadPopup, setShowEditUploadPopup] = useState(false);
  const [showAddLinkPopup, setShowAddLinkPopup] = useState(false);
  const [showEditLinkPopup, setShowEditLinkPopup] = useState(false);
  const [viewLinkIndex, setViewLinkIndex] = useState(null);
  const [editResource, setEditResource] = useState(null);

  // const handleCheckboxChange = (section, index) => {
  //   if (section === "uploads") {
  //     const isSelected = selectedUploads.includes(index);
  //     setSelectedUploads(
  //       isSelected ? selectedUploads.filter(i => i !== index) : [...selectedUploads, index]
  //     );
  //   } else {
  //     const isSelected = selectedLinks.includes(index);
  //     setSelectedLinks(
  //       isSelected ? selectedLinks.filter(i => i !== index) : [...selectedLinks, index]
  //     );
  //   }
  // };

  const handleCheckboxChange = (type, id) => {
    setSelectedUploads((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleCheckbox = (type, id) => {
    setSelectedLinks((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const getFileNameFromUrl = (url) => {
    return url ? url.split("/").pop() : "";
  };

  // useEffect(() => {
  //   AxiosInstance.get(`/resources/?category=${category}&year=${year}&sem=${semester}&div=${div}`) // change this to your actual API endpoint
  //     .then((res) => {setUploads(res.data);
  //       console.log(res.data);
  //     })
  //     .catch((err) => {
  //       console.error("Failed to fetch uploads", err);
  //     });
  // }, [category, year, semester, div]);
  const fetchUploads = useCallback(async () => {
    try {
      const response = await AxiosInstance.get(
        `/resources/?category=${category}&year=${year}&sem=${semester}&div=${div}`
      );
      setUploads(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Failed to fetch uploads", error);
    }
  }, [category, year, semester, div, setUploads]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const fetchLinks = useCallback(async () => {
    try {
      const response = await AxiosInstance.get(
        `/links/?category=${category}&year=${year}&sem=${semester}&div=${div}`
      );
      setLinks(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Failed to fetch uploads", error);
    }
  }, [category, year, semester, div, setLinks]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);
  const [linksData, setLinksData] = useState({});
  const handleViewLink = async (index) => {
    const link = links[index];
    try {
      const res = await AxiosInstance.get(`/student-uploads/grouped-by-division/?link_id=${link.id}`);
      setViewLinkIndex(index);
      setLinksData((prev) => ({
        ...prev,
        [link.id]: res.data, // store by link id
      }));
    } catch (err) {
      console.error("Failed to fetch view data", err);
    }
  };

  const viewData = {
    A: [
      { title: "Final Report", file: "final_report.pdf" },
      { title: "Abstract", file: "abstract.pdf" },
    ],
    B: [
      { title: "Presentation", file: "presentation.pptx" },
      { title: "Certificate", file: "certificate.pdf" },
    ],
  };

  // const linksData = [
  //   { name: "Link 1" },
  //   { name: "Link 2" },
  //   { name: "Link 3" },
  // ];

  // const handleViewLink = (index) => {
  //   setViewLinkIndex(index);
  // };

  function downloadAllAsExcel(linkId) {
    const params = {
      category: category,
      year: year,
      sem: semester,
      div: div,
      link_id: linkId
    };

    AxiosInstance.get('/student-uploads/link-upload-status/', {
      params: params,
      responseType: 'blob'  // Important for downloading files
    })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'link_upload_status.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(error => {
      console.error('Error downloading Excel:', error);
    });
  }
  const handleDelete = async () => {
    if (selectedUploads.length === 0) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedUploads.length} upload(s)?`);
    if (!confirmDelete) return;

    try {
      // Assuming your backend allows deleting one resource at a time:
      for (const id of selectedUploads) {
        await AxiosInstance.delete(`/resources/${id}/`);
      }
      alert("Selected uploads deleted successfully.");
      setSelectedUploads([]); // Clear selection
      fetchUploads();         // Refresh list
    } catch (error) {
      console.error("Failed to delete uploads:", error);
      alert("Failed to delete uploads.");
    }
  };

  const handleDeleteLink = async () => {
    if (selectedLinks.length === 0) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedLinks.length} upload(s)?`);
    if (!confirmDelete) return;

    try {
      // Assuming your backend allows deleting one resource at a time:
      for (const id of selectedLinks) {
        await AxiosInstance.delete(`/links/${id}/`);
      }
      alert("Selected uploads deleted successfully.");
      setSelectedLinks([]); // Clear selection
      fetchLinks();         // Refresh list
    } catch (error) {
      console.error("Failed to delete uploads:", error);
      alert("Failed to delete uploads.");
    }
  };

  return (
    <div className="space-y-6 mt-1"> 
      {showAddUploadPopup && (
        <Popup title="Add Upload" onClose={() => setShowAddUploadPopup(false)}>
          <UploadForm isEdit={false} category={category} year={year} semester={semester} div={div} onClose={() => setShowAddUploadPopup(false)} fetchUploads={fetchUploads}/>
        </Popup>
      )}
      {showEditUploadPopup && (
        <Popup title="Edit Upload" onClose={() => setShowEditUploadPopup(false)}>
          <UploadForm isEdit category={category} year={year} semester={semester} div={div} onClose={() => setShowEditUploadPopup(false)} fetchUploads={fetchUploads} resource={editResource}/>
        </Popup>
      )}
      {showAddLinkPopup && (
        <Popup title="Add Link" onClose={() => setShowAddLinkPopup(false)}>
          <LinkForm isEdit={false} category={category} year={year} semester={semester} div={div} onClose={() => setShowAddLinkPopup(false)} fetchLinks={fetchLinks}/>
        </Popup>
      )}
      {showEditLinkPopup && (
        <Popup title="Edit Link" onClose={() => setShowEditLinkPopup(false)}>
          <LinkForm isEdit category={category} year={year} semester={semester} div={div} onClose={() => setShowEditLinkPopup(false)}  existingLink={linkToEdit} fetchLinks={fetchLinks}/>
        </Popup>
      )}
      <section className="mb-2">
        <h2 className="text-xl font-semibold mb-3">Uploads</h2>
        <div className="flex items-center gap-3 mb-4">
          <input
            placeholder="Search Uploads"
            className="p-2 border rounded w-1/3"
          />  
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setShowAddUploadPopup(true)}
          >
            Add
          </button>
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={() => {
              const resourceToEdit = uploads.find((u) => u.id === selectedUploads[0]);
              setEditResource(resourceToEdit);
              setShowEditUploadPopup(true);
            }}
            disabled={selectedUploads.length !== 1}
          >
            Edit
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={selectedUploads.length < 1}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>

        {/* <table className="w-full bg-white rounded shadow overflow-hidden">
          <thead className="bg-green-500">
            <tr>
              <th className="p-2">✓</th>
              <th className="p-2">Sr No</th>
              <th className="p-2">Name</th>
              <th className="p-2">Document</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, i) => (
              <tr key={i} className="border-t text-center">
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUploads.includes(i)}
                    onChange={() => handleCheckboxChange("uploads", i)}
                  />
                </td>
                <td>{i + 1}</td>
                <td>Upload {i + 1}</td>
                <td>Document {i + 1}.pdf</td>
              </tr>
            ))}
          </tbody>
        </table> */}
        <table className="w-full bg-white rounded shadow overflow-hidden">
      <thead className="bg-green-500">
        <tr>
          <th className="p-2">✓</th>
          <th className="p-2">Sr No</th>
          <th className="p-2">Name</th>
          <th className="p-2">Document</th>
        </tr>
      </thead>
      <tbody>
        {uploads.length === 0 && (
          <tr>
            <td colSpan={4} className="p-4 text-center text-gray-500">
              No uploads found.
            </td>
          </tr>
        )}
        {uploads.map((upload, i) => (
          <tr key={upload.id} className="border-t text-center">
            <td>
              <input
                type="checkbox"
                checked={selectedUploads.includes(upload.id)}
                onChange={() => handleCheckboxChange("uploads", upload.id)}
              />
            </td>
            <td>{i + 1}</td>
            <td>{upload.name}</td>
            <td>
              {upload.file ? (
                <a
                  href={upload.file}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {getFileNameFromUrl(upload.file)}
                </a>
              ) : (
                "No document"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
      </section>

      {/* Links Section */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Links</h2>
        <div className="flex items-center gap-3 mb-4">
          <input
            placeholder="Search Links"
            className="p-2 border rounded w-1/3"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setShowAddLinkPopup(true)}
          >
            Add
          </button>
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={() => {setShowEditLinkPopup(true);
              const link = links.find((u) => u.id === selectedLinks[0]);
              setLinkToEdit(link);
            }}
            disabled={selectedLinks.length !== 1}
          >
            Edit
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={selectedLinks.length < 1}
            onClick={handleDeleteLink}
          >
            Delete
          </button>
          <button
            onClick={() => {
              const selectedId = selectedLinks[0];
              const index = links.findIndex(link => link.id === selectedId);
              handleViewLink(index);}}
            disabled={selectedLinks.length !== 1}
            className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            View
          </button>
        </div>

        <table className="w-full bg-white rounded shadow overflow-hidden">
          <thead className="bg-green-500">
            <tr>
              <th className="p-2">✓</th>
              <th className="p-2">Sr No</th>
              <th className="p-2">Name</th>
              <th className="p-2">Type</th>
              <th className="p-2">Total Uploads</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, i) => (
          <tr key={link.id} className="border-t text-center">
            <td>
              <input
                type="checkbox"
                checked={selectedLinks.includes(link.id)}
                onChange={() => handleCheckbox("links", link.id)}
              />
            </td>
            <td>{i + 1}</td>
            <td>{link.name}</td>
            <td>{link.link_type}</td>
            <td>{link.total_uploads || 0}</td> {/* Add this if you track uploads separately */}
          </tr>
        ))}
          </tbody>
        </table>
      </section>

      {/* ========== POPUPS ========== */}
      

      {/* View Section */}
      {/* {viewLinkIndex !== null && (
        <section className="mt-10 bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              📄 View Details for: {linksData[viewLinkIndex]?.name}
            </h3>
            <button
              // onClick={downloadAllAsExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Download All as Excel
            </button>
          </div>

          {["A", "B"].map((div) => (
            <div key={div} className="mb-6">
              <h4 className="font-semibold text-md mb-2">Division {div}</h4>
              <table className="w-full bg-white rounded shadow overflow-hidden mb-4">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2">Sr No</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {viewData[div].map((item, i) => (
                    <tr key={i} className="border-t text-center">
                      <td>{i + 1}</td>
                      <td>{item.title}</td>
                      <td>
                        <a
                          href={`/${item.file}`}
                          download
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {item.file}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      )} */}
      {viewLinkIndex !== null && (
  <section className="mt-10 bg-white p-6 rounded shadow">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">
        📄 View Details for: {links[viewLinkIndex]?.name}
      </h3>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={() => downloadAllAsExcel(links[viewLinkIndex]?.id)}
      >
        Download All as Excel
      </button>
    </div>

    {Object.entries(linksData[links[viewLinkIndex].id] || {}).map(([div, uploads]) => (
      <div key={div} className="mb-6">
        <h4 className="font-semibold text-md mb-2">Division {div}</h4>
        <table className="w-full bg-white rounded shadow overflow-hidden mb-4">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Sr No</th>
              <th className="p-2">Title</th>
              <th className="p-2">Download</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((item, i) => (
              <tr key={i} className="border-t text-center">
                <td>{item.group_no}</td>
                <td>{item.title}</td>
                <td>
                  <a
                    href={`/${item.file}`}
                    download
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {item.file.split("/").pop()}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </section>
)}
    </div>
  );
};

const Popup = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        aria-label="Close"
      >
        ✖
      </button>
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {children}
    </div>
  </div>
);

const UploadForm = ({ isEdit, category, year, semester, div, onClose, fetchUploads, resource, }) => {
  const [uploadName, setUploadName] = useState("");
  const [file, setFile] = useState(null); // set this dynamically or via prop

  useEffect(() => {
    if (isEdit && resource) {
      setUploadName(resource.name);
    }
  }, [isEdit, resource]);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (!file || !uploadName) {
  //     alert("Please fill all fields");
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("name", uploadName);
  //   formData.append("file", file);

  //   try {
  //     console.log(category,year,semester,div);
  //     const response = await AxiosInstance.post(`/resources/resource_upload/?category=${category}&year=${year}&sem=${semester}&div=${div}`, formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });
  //     console.log("Uploaded:", response.data);
  //     alert("Upload successful");
  //     if (onClose) {
  //       onClose();  // Call the function passed from the parent
  //     }
  //     fetchUploads();

  //   } catch (error) {
  //     console.error("Upload failed:", error);
  //     alert("Upload failed");
  //   }
  // };
    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!uploadName) {
      alert("Please enter a name");
      return;
    }

    if (!isEdit && !file) {
      // On create, file is required
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("name", uploadName);
    if (file) {
      formData.append("file", file); // Only append if a new file was selected
    }

    try {
      if (isEdit) {
        // PUT or PATCH depending on your backend
        const response = await AxiosInstance.patch(
          `/resources/${resource.id}/?category=${category}&year=${year}&sem=${semester}&div=${div}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        alert("Upload updated successfully");
        onClose?.();
      } else {
        // Create
        const response = await AxiosInstance.post(
          `/resources/resource_upload/?category=${category}&year=${year}&sem=${semester}&div=${div}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        alert("Upload successful");
      }

      fetchUploads?.();
      onClose?.();

    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 font-semibold">Title</label>
        <input
          type="text"
          placeholder="Enter title"
          className="w-full p-2 border rounded"
          value={uploadName}
          onChange={(e) => setUploadName(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">File</label>
        <input
          type="file"
          className="w-full"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isEdit ? "Save Changes" : "Add Upload"}
      </button>
    </form>
  );
};

const LinkForm = ({ isEdit, category, year, semester, div, onClose, existingLink, fetchLinks }) => {
  console.log(existingLink);
  const [name, setName] = useState(isEdit ? existingLink.name : "");
  const [linkType, setLinkType] = useState(isEdit ? existingLink.link_type : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !linkType) {
      alert("Both name and type are required.");
      return;
    }

    try {
      const payload = {
        name,
        link_type: linkType
      };

      if (isEdit) {
        await AxiosInstance.patch(`/links/${existingLink.id}/?category=${category}&year=${year}&sem=${semester}&div=${div}`, payload);
      } else {
        await AxiosInstance.post(`/links/create_link/?category=${category}&year=${year}&sem=${semester}&div=${div}`, payload);
      }

      alert(isEdit ? "Link updated" : "Link added");
    } catch (error) {
      console.error("Error submitting link:", error);
      alert("Submission failed");
    }
    onClose();
    fetchLinks();
  };
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 font-semibold">Link Name</label>
        <input
          type="text"
          placeholder="Enter link name"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">Link Type</label>
        <select
          className="w-full p-2 border rounded"
          value={linkType}
          onChange={(e) => setLinkType(e.target.value)}
        >
          <option value="" disabled>
            Select type
          </option>
          <option value="pdf">PDF</option>
          <option value="ppt">PPT</option>
          <option value="word">Word</option>
          <option value="word">Zip</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isEdit ? "Save Changes" : "Add Link"}
      </button>
    </form>
  );
};

export default ResourceManagement;
