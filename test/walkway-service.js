'use strict';

const axios = require('axios');
const baseUrl = 'http://localhost:3000';

class DonationService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getTrails() {
    const response = await axios.get(this.baseUrl + '/api/trails');
    return response.data;
  }

  async getTrail(id) {
    try {
      const response = await axios.get(this.baseUrl + '/api/trails/' + id);
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async createTrail(newTrail) {
    const response = await axios.post(this.baseUrl + '/api/trails', newTrail);
    return response.data;
  }

  async deleteAllTrails() {
    const response = await axios.delete(this.baseUrl + '/api/trails');
    return response.data;
  }

  async deleteOneTrail(id) {
    const response = await axios.delete(this.baseUrl + '/api/trails/' + id);
    return response.data;
  }

  async getUsers() {
    const response = await axios.get(this.baseUrl + '/api/users');
    return response.data;
  }

  async getUser(id) {
    try {
      const response = await axios.get(this.baseUrl + '/api/users/' + id);
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async createUser(newUser) {
    const response = await axios.post(this.baseUrl + '/api/users', newUser);
    return response.data;
  }

  async deleteAllUsers() {
    const response = await axios.delete(this.baseUrl + '/api/users');
    return response.data;
  }

  async deleteOneUser(id) {
    const response = await axios.delete(this.baseUrl + '/api/users/' + id);
    return response.data;
  }
}

module.exports = DonationService;