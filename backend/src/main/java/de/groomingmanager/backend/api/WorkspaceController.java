package de.groomingmanager.backend.api;

import de.groomingmanager.backend.domain.Appointment;
import de.groomingmanager.backend.domain.Customer;
import de.groomingmanager.backend.domain.Pet;
import de.groomingmanager.backend.domain.ServiceOffering;
import de.groomingmanager.backend.repository.AppointmentRepository;
import de.groomingmanager.backend.repository.CustomerRepository;
import de.groomingmanager.backend.repository.PetRepository;
import de.groomingmanager.backend.repository.ServiceOfferingRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkspaceController {
  private static final String DOMAIN_KIND = "domain";
  private static final int BOOTSTRAP_LIMIT = 10;

  private final CustomerRepository customerRepository;
  private final PetRepository petRepository;
  private final AppointmentRepository appointmentRepository;
  private final ServiceOfferingRepository serviceOfferingRepository;

  public WorkspaceController(
      CustomerRepository customerRepository,
      PetRepository petRepository,
      AppointmentRepository appointmentRepository,
      ServiceOfferingRepository serviceOfferingRepository) {
    this.customerRepository = customerRepository;
    this.petRepository = petRepository;
    this.appointmentRepository = appointmentRepository;
    this.serviceOfferingRepository = serviceOfferingRepository;
  }

  @GetMapping("/api/workspace/bootstrap")
  @PreAuthorize("hasRole('admin') or hasRole('groomer') or hasRole('kunde')")
  public WorkspaceBootstrapDto bootstrap(Authentication authentication) {
    List<String> roles = roles(authentication);
    if (roles.contains("ROLE_admin")) {
      return adminBootstrap(authentication, roles);
    }
    if (roles.contains("ROLE_groomer")) {
      return groomerBootstrap(authentication, roles);
    }
    return customerBootstrap(authentication, roles);
  }

  private WorkspaceBootstrapDto adminBootstrap(Authentication authentication, List<String> roles) {
    List<Customer> customers = limitedCustomers();
    List<Appointment> appointments = appointmentRepository.findTop10ByOrderByCreatedAtDesc();
    List<ServiceOffering> services = limitedActiveServices();

    List<WorkspaceDomainDto> domains =
        List.of(
            domain(
                "admin",
                "Administration",
                countSummary(0),
                List.of("customer.create", "service.manage")),
            domain(
                "customers",
                "Kund:innen",
                countSummary(customers.size()),
                List.of("customer.create")),
            domain("dogs", "Hunde", null, List.of()),
            domain(
                "appointments",
                "Termine",
                countSummary(appointments.size()),
                List.of("appointment.status.update")),
            domain(
                "services", "Leistungen", countSummary(services.size()), List.of("service.manage")),
            domain("calendar", "Kalender", null, List.of("appointment.status.update")));

    List<WorkspaceInstanceDto> instances = new ArrayList<>();
    customers.stream().map(WorkspaceController::customerInstance).forEach(instances::add);
    appointments.stream().map(WorkspaceController::appointmentInstance).forEach(instances::add);
    services.stream().map(WorkspaceController::serviceInstance).forEach(instances::add);

    return new WorkspaceBootstrapDto(authentication.getName(), roles, domains, instances);
  }

  private WorkspaceBootstrapDto groomerBootstrap(
      Authentication authentication, List<String> roles) {
    List<Customer> customers = limitedCustomers();
    List<Appointment> appointments = appointmentRepository.findTop10ByOrderByCreatedAtDesc();
    List<ServiceOffering> services = limitedActiveServices();

    List<WorkspaceDomainDto> domains =
        List.of(
            domain(
                "appointments",
                "Termine",
                countSummary(appointments.size()),
                List.of("appointment.status.update")),
            domain("customers", "Kund:innen", countSummary(customers.size()), List.of()),
            domain("dogs", "Hunde", null, List.of()),
            domain("grooming-notes", "Grooming-Notizen", null, List.of()),
            domain("services", "Leistungen", countSummary(services.size()), List.of()));

    List<WorkspaceInstanceDto> instances = new ArrayList<>();
    appointments.stream().map(WorkspaceController::appointmentInstance).forEach(instances::add);
    customers.stream().map(WorkspaceController::customerInstance).forEach(instances::add);
    services.stream().map(WorkspaceController::serviceInstance).forEach(instances::add);

    return new WorkspaceBootstrapDto(authentication.getName(), roles, domains, instances);
  }

  private WorkspaceBootstrapDto customerBootstrap(
      Authentication authentication, List<String> roles) {
    String subject = authentication.getName();
    List<Pet> pets = petRepository.findByOwnerSubjectOrderByCreatedAtDesc(subject);
    List<Appointment> appointments =
        appointmentRepository.findByOwnerSubjectOrderByCreatedAtDesc(subject);
    List<ServiceOffering> services = limitedActiveServices();

    List<WorkspaceDomainDto> domains =
        List.of(
            domain("profile", "Mein Profil", null, List.of("profile.view", "profile.update")),
            domain("dogs", "Meine Hunde", countSummary(pets.size()), List.of("pet.create")),
            domain(
                "appointments",
                "Meine Termine",
                countSummary(appointments.size()),
                List.of("appointment.request")),
            domain("services", "Leistungen", countSummary(services.size()), List.of()));

    List<WorkspaceInstanceDto> instances = new ArrayList<>();
    customerRepository
        .findByKeycloakSubject(subject)
        .map(WorkspaceController::profileInstance)
        .ifPresent(instances::add);
    pets.stream()
        .limit(BOOTSTRAP_LIMIT)
        .map(WorkspaceController::petInstance)
        .forEach(instances::add);
    appointments.stream()
        .limit(BOOTSTRAP_LIMIT)
        .map(WorkspaceController::appointmentInstance)
        .forEach(instances::add);
    services.stream().map(WorkspaceController::serviceInstance).forEach(instances::add);

    return new WorkspaceBootstrapDto(subject, roles, domains, instances);
  }

  private List<Customer> limitedCustomers() {
    return customerRepository.searchByQuery("", PageRequest.of(0, BOOTSTRAP_LIMIT));
  }

  private List<ServiceOffering> limitedActiveServices() {
    return serviceOfferingRepository.findByActiveTrueOrderByNameAsc().stream()
        .limit(BOOTSTRAP_LIMIT)
        .toList();
  }

  private static WorkspaceDomainDto domain(
      String id, String label, Map<String, Object> summary, List<String> actions) {
    return new WorkspaceDomainDto(id, label, DOMAIN_KIND, true, summary, actions);
  }

  private static Map<String, Object> countSummary(int count) {
    Map<String, Object> summary = new LinkedHashMap<>();
    summary.put("count", count);
    return summary;
  }

  private static WorkspaceInstanceDto profileInstance(Customer customer) {
    return new WorkspaceInstanceDto(
        "customer",
        "customer:" + customer.getId(),
        customer.getDisplayName(),
        customerDescription(customer),
        "profile",
        List.of("profile.view", "profile.update"));
  }

  private static WorkspaceInstanceDto customerInstance(Customer customer) {
    return new WorkspaceInstanceDto(
        "customer",
        "customer:" + customer.getId(),
        customer.getDisplayName(),
        customerDescription(customer),
        "customers",
        List.of("customer.view", "customer.update"));
  }

  private static WorkspaceInstanceDto petInstance(Pet pet) {
    return new WorkspaceInstanceDto(
        "pet",
        "pet:" + pet.getId(),
        pet.getName(),
        joinDescription(pet.getBreed(), pet.getSize()),
        "dogs",
        List.of("pet.view", "pet.update", "appointment.request"));
  }

  private static WorkspaceInstanceDto appointmentInstance(Appointment appointment) {
    return new WorkspaceInstanceDto(
        "appointment",
        "appointment:" + appointment.getId(),
        appointment.getAppointmentDate() + " " + appointment.getTimeSlot(),
        appointment.getServiceName(),
        "appointments",
        List.of("appointment.view"));
  }

  private static WorkspaceInstanceDto serviceInstance(ServiceOffering service) {
    return new WorkspaceInstanceDto(
        "service",
        "service:" + service.getId(),
        service.getName(),
        service.getPrice() == null ? null : service.getPrice().toPlainString(),
        "services",
        List.of("appointment.request"));
  }

  private static String customerDescription(Customer customer) {
    return joinDescription(customer.getEmail(), customer.getPhone());
  }

  private static String joinDescription(String first, String second) {
    List<String> parts =
        List.of(nullToBlank(first), nullToBlank(second)).stream()
            .filter(part -> !part.isBlank())
            .toList();
    return parts.isEmpty() ? null : String.join(", ", parts);
  }

  private static String nullToBlank(String value) {
    return value == null ? "" : value.trim();
  }

  private static List<String> roles(Authentication authentication) {
    return authentication.getAuthorities().stream()
        .map(authority -> authority.getAuthority())
        .filter(authority -> authority.startsWith("ROLE_"))
        .sorted(Comparator.naturalOrder())
        .toList();
  }
}
