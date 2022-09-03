<template>
    <div>
      <h1>Chess for You</h1>
      <input type="text" v-model="userName" placeholder="User Name" :maxlength="20" required/>
      <button @click="createPlayer()" v-bind:disabled="!isUserNameValid()">Access Game</button>
    </div>
  </template>
  
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { createPlayer } from "../services/PlayerService";

export default class AccessGame extends Vue {
    userName = "";

    createPlayer(): void {
        createPlayer(this.userName).then(response => {
            console.log(response);
        });

        return;
    }

    isUserNameValid(): boolean {
        return this.userName.trim().length > 0;
    }
    
}
</script>
 
  <!-- Add "scoped" attribute to limit CSS to this component only -->
  <style scoped>
  h1 {
    background-color: aqua;
  }
  </style>
  