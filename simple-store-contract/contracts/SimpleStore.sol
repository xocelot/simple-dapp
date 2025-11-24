// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleStore {
    uint256 private valor;

    // Guarda un número en la blockchain
    function setValor(uint256 _nuevoValor) external {
        valor = _nuevoValor;
    }

    // Lee el número guardado
    function getValor() external view returns (uint256) {
        return valor;
    }
}
