package com.devolva.use.addresses.usecases;

import com.devolva.use.addresses.domain.AddressModel;
import com.devolva.use.addresses.dtos.CreateAddressDto;
import com.devolva.use.addresses.dtos.CepResponseDto;
import com.devolva.use.addresses.repository.AddressRepository;
import com.devolva.use.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AddressUsecases {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public AddressUsecases(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<AddressModel> listByUser(Long userId) {
        validateUserExists(userId);
        return addressRepository.findByOwnerIdAndAtivoTrueOrderByPrincipalDescCreatedAtDesc(userId);
    }

    public AddressModel create(Long userId, CreateAddressDto dto) {
        validateUserExists(userId);
        validateAddress(dto);

        AddressModel address = new AddressModel();

        address.setOwnerId(userId);
        address.setNomeIdentificacao(
                dto.nomeIdentificacao() == null || dto.nomeIdentificacao().isBlank()
                        ? "Endereço"
                        : dto.nomeIdentificacao()
        );

        address.setCep(onlyNumbers(dto.cep()));
        address.setLogradouro(dto.logradouro());
        address.setNumero(dto.numero());
        address.setComplemento(dto.complemento());
        address.setBairro(dto.bairro());
        address.setCidade(dto.cidade());
        address.setEstado(dto.estado());

        boolean firstAddress = !addressRepository.existsByOwnerIdAndAtivoTrue(userId);
        boolean shouldBeMain = firstAddress || Boolean.TRUE.equals(dto.principal());

        if (shouldBeMain) {
            clearMainAddress(userId);
            address.setPrincipal(true);
        }

        return addressRepository.save(address);
    }

    public AddressModel update(Long userId, Long addressId, CreateAddressDto dto) {
        validateUserExists(userId);
        validateAddress(dto);

        AddressModel address = findOwnedAddress(addressId, userId);

        address.setNomeIdentificacao(
                dto.nomeIdentificacao() == null || dto.nomeIdentificacao().isBlank()
                        ? "Endereço"
                        : dto.nomeIdentificacao()
        );

        address.setCep(onlyNumbers(dto.cep()));
        address.setLogradouro(dto.logradouro());
        address.setNumero(dto.numero());
        address.setComplemento(dto.complemento());
        address.setBairro(dto.bairro());
        address.setCidade(dto.cidade());
        address.setEstado(dto.estado());
        address.setUpdatedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(dto.principal())) {
            clearMainAddress(userId);
            address.setPrincipal(true);
        }

        return addressRepository.save(address);
    }

    public AddressModel findOwnedAddress(Long addressId, Long userId) {
        AddressModel address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Endereço não encontrado."));

        if (!address.getOwnerId().equals(userId)) {
            throw new IllegalStateException("Este endereço não pertence ao usuário informado.");
        }

        if (!address.isAtivo()) {
            throw new IllegalStateException("Endereço inativo.");
        }

        return address;
    }

    public void delete(Long userId, Long addressId) {
        AddressModel address = findOwnedAddress(addressId, userId);
        boolean wasMain = address.isPrincipal();

        address.setAtivo(false);
        address.setPrincipal(false);
        address.setUpdatedAt(LocalDateTime.now());

        addressRepository.save(address);

        if (wasMain) {
            List<AddressModel> remainingAddresses =
                    addressRepository.findByOwnerIdAndAtivoTrueOrderByPrincipalDescCreatedAtDesc(userId);

            if (!remainingAddresses.isEmpty()) {
                AddressModel newMain = remainingAddresses.get(0);
                newMain.setPrincipal(true);
                newMain.setUpdatedAt(LocalDateTime.now());
                addressRepository.save(newMain);
            }
        }
    }

    public AddressModel setMain(Long userId, Long addressId) {
        AddressModel selected = findOwnedAddress(addressId, userId);

        clearMainAddress(userId);

        selected.setPrincipal(true);
        selected.setUpdatedAt(LocalDateTime.now());

        return addressRepository.save(selected);
    }

    public CepResponseDto findCep(String cep) {
        String cleanCep = onlyNumbers(cep);

        if (cleanCep.length() != 8) {
            throw new IllegalArgumentException("CEP inválido.");
        }

        String url = "https://viacep.com.br/ws/" + cleanCep + "/json/";

        CepResponseDto response = restTemplate.getForObject(url, CepResponseDto.class);

        if (response == null || Boolean.TRUE.equals(response.erro())) {
            throw new IllegalArgumentException("CEP não encontrado.");
        }

        return response;
    }

    private void clearMainAddress(Long userId) {
        List<AddressModel> mainAddresses = addressRepository.findByOwnerIdAndPrincipalTrueAndAtivoTrue(userId);

        for (AddressModel address : mainAddresses) {
            address.setPrincipal(false);
            address.setUpdatedAt(LocalDateTime.now());
        }

        addressRepository.saveAll(mainAddresses);
    }

    private void validateUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("Usuário não encontrado.");
        }
    }

    private void validateAddress(CreateAddressDto dto) {
        if (dto.cep() == null || onlyNumbers(dto.cep()).length() != 8) {
            throw new IllegalArgumentException("CEP é obrigatório e deve conter 8 números.");
        }

        if (dto.logradouro() == null || dto.logradouro().isBlank()) {
            throw new IllegalArgumentException("Logradouro é obrigatório.");
        }

        if (dto.numero() == null || dto.numero().isBlank()) {
            throw new IllegalArgumentException("Número é obrigatório.");
        }

        if (dto.bairro() == null || dto.bairro().isBlank()) {
            throw new IllegalArgumentException("Bairro é obrigatório.");
        }

        if (dto.cidade() == null || dto.cidade().isBlank()) {
            throw new IllegalArgumentException("Cidade é obrigatória.");
        }

        if (dto.estado() == null || dto.estado().isBlank()) {
            throw new IllegalArgumentException("Estado é obrigatório.");
        }
    }

    private String onlyNumbers(String value) {
        if (value == null) return "";
        return value.replaceAll("\\D", "");
    }
}