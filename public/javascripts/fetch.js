import axios from 'axios'

async function fetchData(query) {
  try {
    const res = await axios.get(`/api/asset/${query}`)
    return res.data
  } catch (err) {
    console.log(err)
  }
}

export default fetchData