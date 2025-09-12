export default function TestFilePicker() {
    const handleChange = (e) => console.log(e.target.files);
    return <input type="file" multiple onChange={handleChange} />;
  }
  