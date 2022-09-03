import axios from "axios";

export async function createPlayer(userName: string) {
    const response = await axios.post(`http://localhost:9090/players`, {"user_name": userName});
    return response.data;
}