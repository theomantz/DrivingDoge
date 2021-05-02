import axios from 'axios'

export default async function fetchData(data) {
  try {
    const res = await axios.get('/data')
    return res.data
  } catch (err) {
    console.log(err)
  }
}